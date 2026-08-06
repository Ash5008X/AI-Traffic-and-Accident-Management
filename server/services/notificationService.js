const NotificationRepository = require('../repositories/NotificationRepository');
const { emitToUser } = require('./socketService');

/**
 * NotificationService
 * Responsible exclusively for user notification creation, delivery, read/unread handling,
 * and notification history. No other service should construct notification documents directly.
 */
class NotificationService {
  /**
   * Creates a notification record and emits a real-time socket event to the receiver.
   */
  static async create(data) {
    try {
      if (!data.receiver) {
        throw new Error('Receiver is required to create a notification');
      }

      const notification = await NotificationRepository.create({
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        priority: data.priority || 'medium',
        sender: data.sender || null,
        receiver: data.receiver,
        relatedIncident: data.relatedIncident || null,
        relatedReliefCenter: data.relatedReliefCenter || null,
        relatedFieldUnit: data.relatedFieldUnit || null,
        broadcastId: data.broadcastId || null,
        targetZone: data.targetZone || null,
      });

      emitToUser(data.receiver, 'notification:new', notification);

      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err.message);
      return null;
    }
  }

  /**
   * Backward-compatible alias used by existing callers.
   */
  static async createNotification(data) {
    return this.create(data);
  }

  /**
   * Fetches notifications for a specific receiver, newest first.
   */
  static async getByReceiver(receiverId, { limit = 50 } = {}) {
    return await NotificationRepository.find(
      { receiverId },
      { sort: { createdAt: -1 }, limit, lean: true }
    );
  }

  /**
   * Counts unread notifications for a receiver.
   */
  static async countUnread(receiverId) {
    return await NotificationRepository.countDocuments({ receiverId, isRead: false });
  }

  /**
   * Marks a single notification as read.
   */
  static async markAsRead(notificationId) {
    return await NotificationRepository.updateMany(
      { _id: notificationId },
      { $set: { isRead: true } }
    );
  }

  /**
   * Marks all notifications as read for a receiver.
   */
  static async markAllAsRead(receiverId) {
    return await NotificationRepository.updateMany(
      { receiverId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

module.exports = NotificationService;
