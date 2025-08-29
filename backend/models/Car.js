const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Car make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Car model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Car year is required'],
    min: [2000, 'Car year must be 2000 or later'],
    max: [new Date().getFullYear() + 1, 'Car year cannot be in the future']
  },
  type: {
    type: String,
    required: [true, 'Car type is required'],
    enum: ['compact', 'sedan', 'suv', 'luxury', 'sports', 'electric'],
    lowercase: true
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [2, 'Car must have at least 2 seats'],
    max: [8, 'Car cannot have more than 8 seats']
  },
  transmission: {
    type: String,
    required: [true, 'Transmission type is required'],
    enum: ['manual', 'automatic'],
    lowercase: true
  },
  fuel: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['gasoline', 'diesel', 'hybrid', 'electric'],
    lowercase: true
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  mileage: {
    type: Number,
    min: [0, 'Mileage cannot be negative'],
    default: 0
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    unique: true,
    minLength: [17, 'VIN must be 17 characters'],
    maxLength: [17, 'VIN must be 17 characters'],
    uppercase: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceNotes: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for location-based queries
carSchema.index({ location: 1, available: 1 });
carSchema.index({ type: 1, pricePerDay: 1 });
carSchema.index({ make: 1, model: 1, year: 1 });

// Virtual for main image
carSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg ? mainImg.url : this.images?.url || '';
});

module.exports = mongoose.model('Car', carSchema);