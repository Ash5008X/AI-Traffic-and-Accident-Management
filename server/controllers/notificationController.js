const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const notificationController = {
  /**
   * Get all notifications for the logged-in user.
   * Merges results from both the Notification model (broadcasts, system alerts)
   * and the Message model (chat-based notifications with receiverId).
   */
  async getAll(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Fetch from Notification model (broadcasts, system, etc.)
      const notifDocs = await Notification.find({ receiver: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch from Message model (chat-based notifications)
      const msgDocs = await Message.find({ receiverId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

      // Normalize Message docs to match Notification shape
      const normalizedMessages = msgDocs.map((msg) => ({
        _id: msg._id,
        title: 'Response Team Update',
        message: msg.content,
        type: 'update',
        priority: 'medium',
        sender: msg.senderId || null,
        receiver: msg.receiverId,
        isRead: msg.isRead || false,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        broadcastId: null,
        targetZone: null,
        _source: 'message', // Internal flag for mark-as-read routing
      }));

      // Tag notification docs with their source
      const taggedNotifs = notifDocs.map((n) => ({
        ...n,
        _source: 'notification',
      }));

      // Merge and sort by createdAt descending
      const merged = [...taggedNotifs, ...normalizedMessages].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return sendSuccess(res, merged);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark a single notification as read.
   * Checks both Notification and Message models.
   */
  async markAsRead(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Try Notification model first
      let notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, receiver: req.user.id },
        { $set: { isRead: true } },
        { new: true }
      );

      if (notification) {
        return sendSuccess(res, notification);
      }

      // Fallback to Message model
      notification = await Message.findOneAndUpdate(
        { _id: req.params.id, receiverId: req.user.id },
        { $set: { isRead: true } },
        { new: true }
      );

      if (notification) {
        return sendSuccess(res, notification);
      }

      return sendError(res, 'Notification not found or unauthorized', 404);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark all notifications as read for the logged-in user.
   * Updates both Notification and Message models.
   */
  async markAllAsRead(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Mark all in Notification model
      await Notification.updateMany(
        { receiver: req.user.id, isRead: false },
        { $set: { isRead: true } }
      );

      // Mark all in Message model
      await Message.updateMany(
        { receiverId: req.user.id, isRead: false },
        { $set: { isRead: true } }
      );

      return sendSuccess(res, { success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },

  // (Optional) Delete a notification
  async delete(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        receiver: req.user.id,
      });

      if (!notification) {
        return sendError(res, 'Notification not found or unauthorized', 404);
      }

      return sendSuccess(res, { success: true, message: 'Notification deleted' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
