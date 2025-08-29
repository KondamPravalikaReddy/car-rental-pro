const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Car = require('../models/Car');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@carrentalpro.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1-555-0100'
    },
    {
      name: 'John Customer',
      email: 'john@example.com',
      password: 'customer123',
      role: 'customer',
      phone: '+1-555-0101'
    }
  ];

  await User.deleteMany({});
  
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
  }
  
  console.log('Users seeded');
};

const seedCars = async () => {
  const cars = [
    {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      type: 'sedan',
      seats: 5,
      transmission: 'automatic',
      fuel: 'hybrid',
      pricePerDay: 45,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
          isMain: true
        }
      ],
      features: ['GPS', 'Bluetooth', 'AC', 'Backup Camera'],
      location: 'New York',
      description: 'Reliable hybrid sedan perfect for city driving',
      licensePlate: 'ABC123',
      vin: '1HGBH41JXMN109186'
    },
    // Add more cars...
  ];

  await Car.deleteMany({});
  await Car.insertMany(cars);
  console.log('Cars seeded');
};

const seedDatabase = async () => {
  await connectDB();
  await seedUsers();
  await seedCars();
  console.log('Database seeded successfully');
  process.exit(0);
};

seedDatabase().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});