const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const moment = require('moment');

const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, [
  body('carId').isMongoId().withMessage('Valid car ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('pickupLocation.address').optional().trim().notEmpty().withMessage('Pickup address cannot be empty'),
  body('dropoffLocation.address').optional().trim().notEmpty().withMessage('Dropoff address cannot be empty'),
  body('driverInfo.licenseNumber').optional().trim().notEmpty().withMessage('License number cannot be empty')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { carId, startDate, endDate, pickupLocation, dropoffLocation, driverInfo, notes } = req.body;
  
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate dates
  if (start >= end) {
    return next(new AppError('End date must be after start date', 400));
  }

  if (start < new Date()) {
    return next(new AppError('Start date cannot be in the past', 400));
  }

  // Check if car exists and is available
  const car = await Car.findById(carId);
  if (!car) {
    return next(new AppError('Car not found', 404));
  }

  if (!car.available) {
    return next(new AppError('Car is not available for booking', 400));
  }

  // Check for booking conflicts
  const hasConflicts = await Booking.checkConflicts(carId, start, end);
  if (hasConflicts) {
    return next(new AppError('Car is already booked for the selected dates', 409));
  }

  // Create booking
  const bookingData = {
    user: req.user._id,
    car: carId,
    startDate: start,
    endDate: end,
    pricePerDay: car.pricePerDay,
    pickupLocation,
    dropoffLocation,
    driverInfo,
    notes
  };

  const booking = await Booking.create(bookingData);

  // Populate the created booking
  const populatedBooking = await Booking.findById(booking._id)
    .populate('car', 'make model year images location')
    .populate('user', 'name email phone');

  // Send booking confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Booking Confirmation - CarRental Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmation</h2>
          <p>Dear ${req.user.name},</p>
          <p>Your booking has been created successfully!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Car:</strong> ${car.year} ${car.make} ${car.model}</p>
            <p><strong>Pickup Date:</strong> ${moment(start).format('MMMM Do, YYYY')}</p>
            <p><strong>Return Date:</strong> ${moment(end).format('MMMM Do, YYYY')}</p>
            <p><strong>Total Days:</strong> ${booking.totalDays}</p>
            <p><strong>Total Amount:</strong> $${booking.totalAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
          </div>
          
          <p>Please complete your payment to confirm this booking.</p>
          <p>Thank you for choosing CarRental Pro!</p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Failed to send booking confirmation email:', emailError);
  }

  res.status(201).json({
    success: true,
    data: populatedBooking
  });
}));

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = { user: req.user._id };
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Execute queries
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('car', 'make model year images pricePerDay location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    currentPage: page,
    totalPages,
    data: bookings
  });
}));

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('car', 'make model year images pricePerDay location features description')
    .populate('user', 'name email phone address');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check if user owns this booking or is admin
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access this booking', 403));
  }

  res.status(200).json({
    success: true,
    data: booking
  });
}));

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
router.put('/:id/status', protect, [
  body('status').isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('cancellationReason').optional().trim().notEmpty().withMessage('Cancellation reason cannot be empty')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { status, cancellationReason } = req.body;
  
  const booking = await Booking.findById(req.params.id)
    .populate('car', 'make model year')
    .populate('user', 'name email');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Authorization checks
  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('Not authorized to update this booking', 403));
  }

  // Status transition validation
  const allowedTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['active', 'cancelled'],
    active: ['completed'],
    completed: [],
    cancelled: []
  };

  if (!allowedTransitions[booking.status].includes(status)) {
    return next(new AppError(`Cannot change status from ${booking.status} to ${status}`, 400));
  }

  // Additional checks for customer vs admin
  if (!isAdmin) {
    // Customers can only cancel their own bookings
    if (status !== 'cancelled') {
      return next(new AppError('Customers can only cancel bookings', 403));
    }
    
    // Cannot cancel if booking starts within 24 hours
    const now = new Date();
    const timeDiff = booking.startDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return next(new AppError('Cannot cancel booking within 24 hours of start date', 400));
    }
  }

  // Update booking
  const updateData = { status };
  
  if (status === 'cancelled') {
    updateData.cancellationReason = cancellationReason || 'No reason provided';
    updateData.cancellationDate = new Date();
    
    // Calculate refund amount based on cancellation time
    const now = new Date();
    const timeDiff = booking.startDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 72) { // 72+ hours: full refund
      updateData.refundAmount = booking.totalAmount;
    } else if (hoursDiff > 24) { // 24-72 hours: 50% refund
      updateData.refundAmount = booking.totalAmount * 0.5;
    } else { // <24 hours: no refund
      updateData.refundAmount = 0;
    }
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('car', 'make model year').populate('user', 'name email');

  // Send status update email
  try {
    let emailSubject = '';
    let emailContent = '';
    
    switch (status) {
      case 'confirmed':
        emailSubject = 'Booking Confirmed - CarRental Pro';
        emailContent = `
          <h2>Booking Confirmed!</h2>
          <p>Great news! Your booking for the ${booking.car.year} ${booking.car.make} ${booking.car.model} has been confirmed.</p>
          <p>Your booking is now confirmed and ready for pickup on ${moment(booking.startDate).format('MMMM Do, YYYY')}.</p>
        `;
        break;
      case 'cancelled':
        emailSubject = 'Booking Cancelled - CarRental Pro';
        emailContent = `
          <h2>Booking Cancelled</h2>
          <p>Your booking for the ${booking.car.year} ${booking.car.make} ${booking.car.model} has been cancelled.</p>
          <p><strong>Reason:</strong> ${cancellationReason}</p>
          <p><strong>Refund Amount:</strong> $${updatedBooking.refundAmount.toFixed(2)}</p>
          <p>If you have any questions, please contact our customer support.</p>
        `;
        break;
      case 'active':
        emailSubject = 'Rental Active - CarRental Pro';
        emailContent = `
          <h2>Your Rental is Now Active</h2>
          <p>Enjoy your ride with the ${booking.car.year} ${booking.car.make} ${booking.car.model}!</p>
          <p>Please remember to return the car on ${moment(booking.endDate).format('MMMM Do, YYYY')}.</p>
          <p>Drive safely!</p>
        `;
        break;
      case 'completed':
        emailSubject = 'Rental Completed - CarRental Pro';
        emailContent = `
          <h2>Rental Completed</h2>
          <p>Thank you for choosing CarRental Pro!</p>
          <p>Your rental of the ${booking.car.year} ${booking.car.make} ${booking.car.model} has been completed.</p>
          <p>We hope you had a great experience. Please consider leaving a review!</p>
        `;
        break;
    }
    
    if (emailSubject) {
      await sendEmail({
        email: booking.user.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailContent}
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            </div>
            <p>Thank you for choosing CarRental Pro!</p>
          </div>
        `
      });
    }
  } catch (emailError) {
    console.error('Failed to send booking status update email:', emailError);
  }

  res.status(200).json({
    success: true,
    data: updatedBooking
  });
}));

// @desc    Cancel booking (Customer only, within allowed time)
// @route   DELETE /api/bookings/:id
// @access  Private
router.delete('/:id', protect, [
  body('reason').optional().trim().notEmpty().withMessage('Cancellation reason cannot be empty')
], catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check if user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  // Check if booking can be cancelled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return next(new AppError('Cannot cancel booking with current status', 400));
  }

  // Check cancellation time constraints
  const now = new Date();
  const timeDiff = booking.startDate - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    return next(new AppError('Cannot cancel booking within 24 hours of start date', 400));
  }

  // Calculate refund
  let refundAmount = 0;
  if (hoursDiff > 72) {
    refundAmount = booking.totalAmount; // Full refund
  } else if (hoursDiff > 24) {
    refundAmount = booking.totalAmount * 0.5; // 50% refund
  }

  // Update booking to cancelled
  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      status: 'cancelled',
      cancellationReason: req.body.reason || 'Cancelled by customer',
      cancellationDate: new Date(),
      refundAmount
    },
    { new: true }
  ).populate('car', 'make model year').populate('user', 'name email');

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    refundAmount,
    data: updatedBooking
  });
}));

// @desc    Get booking statistics (Admin only)
// @route   GET /api/bookings/admin/stats
// @access  Private (Admin)
router.get('/admin/stats', protect, authorize('admin'), catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalBookings,
    monthlyBookings,
    yearlyBookings,
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    statusBreakdown,
    popularCars
  ] = await Promise.all([
    // Total bookings
    Booking.countDocuments(),
    
    // Monthly bookings
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    
    // Yearly bookings
    Booking.countDocuments({ createdAt: { $gte: startOfYear } }),
    
    // Total revenue
    Booking.aggregate([
      { $match: { status: { $in: ['completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    
    // Monthly revenue
    Booking.aggregate([
      { 
        $match: { 
          status: { $in: ['completed'] },
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    
    // Yearly revenue
    Booking.aggregate([
      { 
        $match: { 
          status: { $in: ['completed'] },
          createdAt: { $gte: startOfYear }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    
    // Status breakdown
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    // Popular cars
    Booking.aggregate([
      { $group: { _id: '$car', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'cars',
          localField: '_id',
          foreignField: '_id',
          as: 'car'
        }
      },
      { $unwind: '$car' },
      {
        $project: {
          bookings: 1,
          'car.make': 1,
          'car.model': 1,
          'car.year': 1
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      bookings: {
        total: totalBookings,
        monthly: monthlyBookings,
        yearly: yearlyBookings
      },
      revenue: {
        total: totalRevenue?.total || 0,
        monthly: monthlyRevenue?.total || 0,
        yearly: yearlyRevenue?.total || 0
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      popularCars
    }
  });
}));

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private (Admin)
router.get('/admin/all', protect, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  if (req.query.search) {
    // Search in user name, email, or car make/model
    query.$or = [
      { 'user.name': { $regex: req.query.search, $options: 'i' } },
      { 'user.email': { $regex: req.query.search, $options: 'i' } },
      { 'car.make': { $regex: req.query.search, $options: 'i' } },
      { 'car.model': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Execute queries
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('car', 'make model year images pricePerDay location')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    currentPage: page,
    totalPages,
    data: bookings
  });
}));

module.exports = router;