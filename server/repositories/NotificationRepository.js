const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Encapsulates all database operations for Notifications.
 */
class NotificationRepository {
  static async create(notificationData) {
    return await Notification.create(notificationData);
  }

  static async find(filter = {}, { sort = { createdAt: -1 }, limit = null, lean = true } = {}) {
    let query = Notification.find(filter).sort(sort);
    if (limit) {
      query = query.limit(limit);
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async countDocuments(filter = {}) {
    return await Notification.countDocuments(filter);
  }

  static async updateMany(filter, updateData) {
    return await Notification.updateMany(filter, updateData);
  }
}

module.exports = NotificationRepository;
