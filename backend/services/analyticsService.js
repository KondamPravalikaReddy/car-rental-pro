const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');

class AnalyticsService {
  static async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const stats = await Promise.all([
      // Basic counts
      User.countDocuments({ role: 'customer' }),
      Car.countDocuments(),
      Booking.countDocuments(),
      
      // Revenue stats
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Monthly stats
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Popular cars
      Booking.aggregate([
        { $group: { _id: '$car', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'cars',
            localField: '_id',
            foreignField: '_id',
            as: 'car'
          }
        },
        { $unwind: '$car' }
      ]),

      // Booking trends (last 12 months)
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 12)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    return {
      totalCustomers: stats,
      totalCars: stats,
      totalBookings: stats,
      totalRevenue: stats?.total || 0,
      monthlyBookings: stats,
      monthlyRevenue: stats?.total || 0,
      popularCars: stats,
      bookingTrends: stats
    };
  }

  static async getCarUtilization() {
    const cars = await Car.find();
    const utilization = [];

    for (const car of cars) {
      const bookings = await Booking.countDocuments({
        car: car._id,
        status: { $in: ['confirmed', 'active', 'completed'] }
      });

      const totalRevenue = await Booking.aggregate([
        { $match: { car: car._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      utilization.push({
        car: {
          id: car._id,
          make: car.make,
          model: car.model,
          year: car.year,
          licensePlate: car.licensePlate
        },
        bookings,
        revenue: totalRevenue?.total || 0,
        utilizationRate: bookings > 0 ? (bookings / 365) * 100 : 0
      });
    }

    return utilization.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }
}

module.exports = AnalyticsService;