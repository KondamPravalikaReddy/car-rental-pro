const sendEmail = require('../utils/sendEmail');

class NotificationService {
  static async sendBookingReminder(booking) {
    const reminderDate = new Date(booking.startDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    if (new Date() >= reminderDate) {
      await sendEmail({
        email: booking.user.email,
        subject: 'Booking Reminder - Tomorrow',
        html: `
          <h2>Booking Reminder</h2>
          <p>Your car rental starts tomorrow!</p>
          <p>Car: ${booking.car.make} ${booking.car.model}</p>
          <p>Pickup time: ${booking.startDate}</p>
        `
      });
    }
  }

  static async sendMaintenanceAlert(car) {
    // Send alert when car needs maintenance
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await sendEmail({
        email: admin.email,
        subject: 'Car Maintenance Required',
        html: `
          <h2>Maintenance Alert</h2>
          <p>Car ${car.make} ${car.model} (${car.licensePlate}) requires maintenance.</p>
        `
      });
    }
  }
}

module.exports = NotificationService;