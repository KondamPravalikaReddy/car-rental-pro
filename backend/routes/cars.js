const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new AppError('Only image files (JPEG, JPG, PNG, WebP) are allowed', 400));
    }
  }
});

// @desc    Get all cars with filtering, sorting, and pagination
// @route   GET /api/cars
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('priceMin').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
  query('priceMax').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
  query('seats').optional().isInt({ min: 1, max: 8 }).withMessage('Seats must be between 1 and 8'),
  query('year').optional().isInt({ min: 2000 }).withMessage('Year must be 2000 or later')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Build query object
  const queryObj = { available: true };

  // Filter by parameters
  const {
    type,
    make,
    model,
    location,
    transmission,
    fuel,
    priceMin,
    priceMax,
    seats,
    year,
    features,
    search,
    startDate,
    endDate
  } = req.query;

  if (type) queryObj.type = type.toLowerCase();
  if (make) queryObj.make = new RegExp(make, 'i');
  if (model) queryObj.model = new RegExp(model, 'i');
  if (location) queryObj.location = new RegExp(location, 'i');
  if (transmission) queryObj.transmission = transmission.toLowerCase();
  if (fuel) queryObj.fuel = fuel.toLowerCase();
  if (seats) queryObj.seats = parseInt(seats);
  if (year) queryObj.year = parseInt(year);

  // Price range filter
  if (priceMin || priceMax) {
    queryObj.pricePerDay = {};
    if (priceMin) queryObj.pricePerDay.$gte = parseFloat(priceMin);
    if (priceMax) queryObj.pricePerDay.$lte = parseFloat(priceMax);
  }

  // Features filter
  if (features) {
    const featuresArray = Array.isArray(features) ? features : [features];
    queryObj.features = { $in: featuresArray.map(f => new RegExp(f, 'i')) };
  }

  // Search filter (searches across multiple fields)
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    queryObj.$or = [
      { make: searchRegex },
      { model: searchRegex },
      { location: searchRegex },
      { description: searchRegex },
      { features: { $in: [searchRegex] } }
    ];
  }

  // If dates are provided, exclude cars that are booked during that period
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return next(new AppError('Start date must be before end date', 400));
    }
    
    if (start < new Date()) {
      return next(new AppError('Start date cannot be in the past', 400));
    }

    // Find cars that are NOT booked during the requested period
    const bookedCarIds = await Booking.distinct('car', {
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lte: start }, endDate: { $gt: start } },
        { startDate: { $lt: end }, endDate: { $gte: end } },
        { startDate: { $gte: start }, endDate: { $lte: end } }
      ]
    });

    queryObj._id = { $nin: bookedCarIds };
  }

  // Execute query with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sorting
  let sortBy = {};
  const sort = req.query.sort;
  switch (sort) {
    case 'price-asc':
      sortBy = { pricePerDay: 1 };
      break;
    case 'price-desc':
      sortBy = { pricePerDay: -1 };
      break;
    case 'year-desc':
      sortBy = { year: -1 };
      break;
    case 'rating-desc':
      sortBy = { 'rating.average': -1 };
      break;
    case 'name-asc':
      sortBy = { make: 1, model: 1 };
      break;
    default:
      sortBy = { createdAt: -1 };
  }

  // Execute queries
  const [cars, total] = await Promise.all([
    Car.find(queryObj)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Car.countDocuments(queryObj)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    count: cars.length,
    total,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    data: cars
  });
}));

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
router.get('/:id', catchAsync(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) {
    return next(new AppError('Car not found', 404));
  }

  // Get average rating and review count (if you have a Review model)
  // const reviews = await Review.find({ car: car._id });
  // car.rating = calculateAverageRating(reviews);

  res.status(200).json({
    success: true,
    data: car
  });
}));

// @desc    Check car availability for specific dates
// @route   GET /api/cars/:id/availability
// @access  Public
router.get('/:id/availability', [
  query('startDate').isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').isISO8601().withMessage('End date must be a valid date')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { startDate, endDate } = req.query;
  const carId = req.params.id;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return next(new AppError('Start date must be before end date', 400));
  }

  if (start < new Date()) {
    return next(new AppError('Start date cannot be in the past', 400));
  }

  // Check if car exists
  const car = await Car.findById(carId);
  if (!car) {
    return next(new AppError('Car not found', 404));
  }

  if (!car.available) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: 'Car is currently unavailable'
    });
  }

  // Check for booking conflicts
  const hasConflicts = await Booking.checkConflicts(carId, start, end);

  res.status(200).json({
    success: true,
    available: !hasConflicts,
    reason: hasConflicts ? 'Car is booked during the selected dates' : null
  });
}));

// @desc    Create new car (Admin only)
// @route   POST /api/cars
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), upload.array('images', 10), [
  body('make').trim().notEmpty().withMessage('Car make is required'),
  body('model').trim().notEmpty().withMessage('Car model is required'),
  body('year').isInt({ min: 2000 }).withMessage('Year must be 2000 or later'),
  body('type').isIn(['compact', 'sedan', 'suv', 'luxury', 'sports', 'electric']).withMessage('Invalid car type'),
  body('seats').isInt({ min: 2, max: 8 }).withMessage('Seats must be between 2 and 8'),
  body('transmission').isIn(['manual', 'automatic']).withMessage('Transmission must be manual or automatic'),
  body('fuel').isIn(['gasoline', 'diesel', 'hybrid', 'electric']).withMessage('Invalid fuel type'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('licensePlate').trim().notEmpty().withMessage('License plate is required'),
  body('vin').isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  // Check if car with same license plate or VIN already exists
  const existingCar = await Car.findOne({
    $or: [
      { licensePlate: req.body.licensePlate.toUpperCase() },
      { vin: req.body.vin.toUpperCase() }
    ]
  });

  if (existingCar) {
    return next(new AppError('Car with this license plate or VIN already exists', 400));
  }

  // Handle image uploads
  let images = [];
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadToCloudinary(file.buffer, 'cars');
      images.push({
        url: result.secure_url,
        publicId: result.public_id,
        isMain: i === 0 // First image is main
      });
    }
  } else {
    return next(new AppError('At least one car image is required', 400));
  }

  const carData = {
    ...req.body,
    images,
    licensePlate: req.body.licensePlate.toUpperCase(),
    vin: req.body.vin.toUpperCase(),
    features: Array.isArray(req.body.features) ? req.body.features : [req.body.features].filter(Boolean)
  };

  const car = await Car.create(carData);

  res.status(201).json({
    success: true,
    data: car
  });
}));

// @desc    Update car (Admin only)
// @route   PUT /api/cars/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), upload.array('images', 10), [
  body('make').optional().trim().notEmpty().withMessage('Car make cannot be empty'),
  body('model').optional().trim().notEmpty().withMessage('Car model cannot be empty'),
  body('year').optional().isInt({ min: 2000 }).withMessage('Year must be 2000 or later'),
  body('type').optional().isIn(['compact', 'sedan', 'suv', 'luxury', 'sports', 'electric']).withMessage('Invalid car type'),
  body('seats').optional().isInt({ min: 2, max: 8 }).withMessage('Seats must be between 2 and 8'),
  body('transmission').optional().isIn(['manual', 'automatic']).withMessage('Transmission must be manual or automatic'),
  body('fuel').optional().isIn(['gasoline', 'diesel', 'hybrid', 'electric']).withMessage('Invalid fuel type'),
  body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  let car = await Car.findById(req.params.id);
  if (!car) {
    return next(new AppError('Car not found', 404));
  }

  // Handle image uploads if provided
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    for (const image of car.images) {
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }
    }

    // Upload new images
    const newImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadToCloudinary(file.buffer, 'cars');
      newImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        isMain: i === 0
      });
    }
    req.body.images = newImages;
  }

  // Prepare update data
  const updateData = { ...req.body };
  if (updateData.licensePlate) {
    updateData.licensePlate = updateData.licensePlate.toUpperCase();
  }
  if (updateData.vin) {
    updateData.vin = updateData.vin.toUpperCase();
  }
  if (updateData.features) {
    updateData.features = Array.isArray(updateData.features) 
      ? updateData.features 
      : [updateData.features].filter(Boolean);
  }

  car = await Car.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: car
  });
}));

// @desc    Delete car (Admin only)
// @route   DELETE /api/cars/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), catchAsync(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) {
    return next(new AppError('Car not found', 404));
  }

  // Check if car has any active bookings
  const activeBookings = await Booking.countDocuments({
    car: car._id,
    status: { $in: ['confirmed', 'active'] }
  });

  if (activeBookings > 0) {
    return next(new AppError('Cannot delete car with active bookings', 400));
  }

  // Delete images from Cloudinary
  for (const image of car.images) {
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }
  }

  await Car.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Car deleted successfully'
  });
}));

// @desc    Get car types and locations for filters
// @route   GET /api/cars/meta/filters
// @access  Public
router.get('/meta/filters', catchAsync(async (req, res) => {
  const [types, locations, makes, fuelTypes, transmissions] = await Promise.all([
    Car.distinct('type'),
    Car.distinct('location'),
    Car.distinct('make'),
    Car.distinct('fuel'),
    Car.distinct('transmission')
  ]);

  // Get price range
  const priceStats = await Car.aggregate([
    { $group: {
        _id: null,
        minPrice: { $min: '$pricePerDay' },
        maxPrice: { $max: '$pricePerDay' },
        avgPrice: { $avg: '$pricePerDay' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      types: types.sort(),
      locations: locations.sort(),
      makes: makes.sort(),
      fuelTypes: fuelTypes.sort(),
      transmissions: transmissions.sort(),
      priceRange: priceStats || { minPrice: 0, maxPrice: 100, avgPrice: 50 }
    }
  });
}));

module.exports = router;