const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  totalDays: {
    type: Number,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required']
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxes: {
    type: Number,
    default: 0
  },
  fees: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String, // Stripe Payment Intent ID
    unique: true,
    sparse: true
  },
  pickupLocation: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  dropoffLocation: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  driverInfo: {
    licenseNumber: String,
    licenseExpiry: Date,
    licenseImage: String
  },
  cancellationReason: String,
  cancellationDate: Date,
  refundAmount: {
    type: Number,
    default: 0
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent double bookings
bookingSchema.index({ 
  car: 1, 
  startDate: 1, 
  endDate: 1,
  status: 1 
});

// Index for user bookings
bookingSchema.index({ user: 1, createdAt: -1 });

// Pre-save middleware to calculate total days and amounts
bookingSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.subtotal = this.totalDays * this.pricePerDay;
    this.taxes = this.subtotal * 0.08; // 8% tax
    this.fees = 25; // Flat service fee
    this.totalAmount = this.subtotal + this.taxes + this.fees;
  }
  next();
});

// Static method to check for booking conflicts
bookingSchema.statics.checkConflicts = async function(carId, startDate, endDate, excludeBookingId) {
  const query = {
    car: carId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lte: startDate }, endDate: { $gt: startDate } },
      { startDate: { $lt: endDate }, endDate: { $gte: endDate } },
      { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflicts = await this.find(query);
  return conflicts.length > 0;
};

module.exports = mongoose.model('Booking', bookingSchema);