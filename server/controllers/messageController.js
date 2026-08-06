const Message = require('../models/Message');
const Incident = require('../models/Incident');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { emitToIncident, emitToUser } = require('../services/socketService');

const messageController = {
  async getMessages(req, res, next) {
    try {
      const { incidentId } = req.query;
      const filter = incidentId ? { incidentId } : {};

      const messages = await Message.find(filter).sort({ createdAt: 1 });
      return sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  },

  async postMessage(req, res, next) {
    try {
      const { incidentId, content, senderRole, senderName } = req.body;

      if (!incidentId || !content) {
        return sendError(res, 'incidentId and content are required', 400);
      }

      let receiverId = null;
      const incident = await Incident.findById(incidentId);

      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      if (['resolved', 'dismissed'].includes(incident.status)) {
        return sendError(res, 'Communications are disabled for completed or resolved incidents.', 400);
      }

      if (incident.reportedBy) {
        receiverId = incident.reportedBy;
      }

      const msg = await Message.create({
        incidentId,
        content,
        senderRole: senderRole || (req.user ? req.user.role : 'user'),
        senderName: senderName || (req.user ? req.user.name : 'Dispatcher'),
        senderId: req.user ? req.user.id : null,
        receiverId: senderRole === 'relief_admin' ? receiverId : null,
      });

      // Also push to incident chat array
      await Incident.findByIdAndUpdate(
        incidentId,
        {
          $push: {
            chat: {
              message: content,
              senderRole: msg.senderRole,
              senderName: msg.senderName,
              senderId: msg.senderId,
              timestamp: msg.createdAt,
            },
          },
        },
        { new: true }
      );

      emitToIncident(incidentId, 'chat:message', {
        incidentId,
        message: content,
        senderRole: msg.senderRole,
        senderName: msg.senderName,
        senderId: msg.senderId,
        timestamp: msg.createdAt,
      });

      // Notify the reporting user via socket
      if (msg.senderRole === 'relief_admin' && receiverId) {
        emitToUser(receiverId, 'notification:new', msg);
      }

      return sendSuccess(res, msg, 201);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/notifications
  async getNotifications(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      const notifications = await Message.find({ receiverId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

      return sendSuccess(res, notifications);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/notifications/:id/read
  async markAsRead(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      const notification = await Message.findOneAndUpdate(
        { _id: req.params.id, receiverId: req.user.id },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!notification) {
        return sendError(res, 'Notification not found or unauthorized', 404);
      }

      return sendSuccess(res, notification);
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/notifications/read-all
  async markAllAsRead(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      await Message.updateMany(
        { receiverId: req.user.id, isRead: false },
        { $set: { isRead: true } }
      );

      return sendSuccess(res, { success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = messageController;
