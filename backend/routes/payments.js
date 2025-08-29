
const { protect, authorize } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');

const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { bookingId } = req.body;

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('car', 'make model year')
    .populate('user', 'name email');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Verify booking ownership
  if (booking.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to pay for this booking', 403));
  }

  // Check if booking is in payable state
  if (booking.paymentStatus === 'completed') {
    return next(new AppError('Booking has already been paid', 400));
  }

  if (!['pending'].includes(booking.status)) {
    return next(new AppError('Booking is not in a payable state', 400));
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      customer_email: booking.user.email,
      metadata: {
        bookingId: booking._id.toString(),
        userId: booking.user._id.toString(),
        carInfo: `${booking.car.year} ${booking.car.make} ${booking.car.model}`
      },
      description: `Car rental payment for ${booking.car.year} ${booking.car.make} ${booking.car.model}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record
    await Payment.create({
      booking: booking._id,
      user: booking.user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: booking.totalAmount,
      currency: 'usd',
      status: 'pending',
      description: `Payment for booking ${booking._id}`
    });

    // Update booking with payment intent ID
    await Booking.findByIdAndUpdate(bookingId, {
      paymentIntentId: paymentIntent.id
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return next(new AppError('Payment processing failed', 500));
  }
}));

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { paymentIntentId } = req.body;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return next(new AppError('Payment not successful', 400));
    }

    // Find booking and payment
    const booking = await Booking.findOne({ paymentIntentId })
      .populate('car', 'make model year images location')
      .populate('user', 'name email');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Verify ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    // Update booking and payment status
    await Promise.all([
      Booking.findByIdAndUpdate(booking._id, {
        status: 'confirmed',
        paymentStatus: 'completed'
      }),
      Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { 
          status: 'succeeded',
          receiptEmail: paymentIntent.receipt_email
        }
      )
    ]);

    // Send confirmation email
    try {
      await sendEmail({
        email: booking.user.email,
        subject: 'Payment Confirmed - CarRental Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Payment Confirmed!</h2>
            <p>Dear ${booking.user.name},</p>
            <p>Your payment has been processed successfully and your booking is now confirmed!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Car:</strong> ${booking.car.year} ${booking.car.make} ${booking.car.model}</p>
              <p><strong>Pickup Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</p>
              <p><strong>Return Date:</strong> ${new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Total Amount Paid:</strong> $${booking.totalAmount.toFixed(2)}</p>
              <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Next Steps</h4>
              <p>• Arrive at the pickup location on your scheduled date</p>
              <p>• Bring a valid driver's license and ID</p>
              <p>• Our team will contact you 24 hours before pickup</p>
            </div>
            
            <p>Thank you for choosing CarRental Pro!</p>
            <p>If you have any questions, please contact our customer support.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      booking: {
        id: booking._id,
        status: 'confirmed',
        paymentStatus: 'completed'
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return next(new AppError('Payment confirmation failed', 500));
  }
}));

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Admin)
router.post('/refund', protect, authorize('admin'), [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  body('reason').optional().trim().notEmpty().withMessage('Refund reason cannot be empty')
], catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { paymentIntentId, amount, reason } = req.body;

  try {
    // Get payment intent details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return next(new AppError('Cannot refund unsuccessful payment', 400));
    }

    // Find booking and payment
    const [booking, payment] = await Promise.all([
      Booking.findOne({ paymentIntentId })
        .populate('car', 'make model year')
        .populate('user', 'name email'),
      Payment.findOne({ stripePaymentIntentId: paymentIntentId })
    ]);

    if (!booking || !payment) {
      return next(new AppError('Booking or payment not found', 404));
    }

    // Calculate refund amount
    const refundAmount = amount || booking.refundAmount || booking.totalAmount;
    const refundAmountCents = Math.round(refundAmount * 100);

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        bookingId: booking._id.toString(),
        adminReason: reason || 'Admin processed refund'
      }
    });

    // Update payment record with refund info
    await Payment.findByIdAndUpdate(payment._id, {
      $push: {
        refunds: {
          amount: refundAmount,
          reason: reason || 'Admin processed refund',
          status: refund.status,
          stripeRefundId: refund.id,
          createdAt: new Date()
        }
      }
    });

    // Update booking refund amount
    await Booking.findByIdAndUpdate(booking._id, {
      refundAmount: refundAmount
    });

    // Send refund notification email
    try {
      await sendEmail({
        email: booking.user.email,
        subject: 'Refund Processed - CarRental Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Refund Processed</h2>
            <p>Dear ${booking.user.name},</p>
            <p>Your refund has been processed successfully.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Refund Details</h3>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Car:</strong> ${booking.car.year} ${booking.car.make} ${booking.car.model}</p>
              <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
              <p><strong>Refund ID:</strong> ${refund.id}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>The refund will appear in your account within 5-10 business days.</p>
            <p>Thank you for your understanding.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send refund notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return next(new AppError('Refund processing failed', 500));
  }
}));

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('booking', 'startDate endDate totalAmount status')
    .populate({
      path: 'booking',
      populate: {
        path: 'car',
        select: 'make model year images'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
}));

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', protect, catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking')
    .populate({
      path: 'booking',
      populate: {
        path: 'car',
        select: 'make model year images location'
      }
    });

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check authorization
  if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view this payment', 403));
  }

  res.status(200).json({
    success: true,
    data: payment
  });
}));

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (but verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentFailed(event.data.object);
      break;
    case 'refund.created':
      handleRefundCreated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Helper functions for webhook handling
async function handlePaymentSucceeded(paymentIntent) {
  try {
    await Promise.all([
      Booking.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { 
          status: 'confirmed',
          paymentStatus: 'completed'
        }
      ),
      Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: 'succeeded' }
      )
    ]);
    
    console.log(`Payment succeeded for ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'failed' }
    );
    
    console.log(`Payment failed for ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleRefundCreated(refund) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: refund.payment_intent 
    });
    
    if (payment) {
      payment.refunds.push({
        amount: refund.amount / 100,
        reason: refund.reason,
        status: refund.status,
        stripeRefundId: refund.id,
        createdAt: new Date()
      });
      await payment.save();
    }
    
    console.log(`Refund created for ${refund.payment_intent}`);
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}

module.exports = router;