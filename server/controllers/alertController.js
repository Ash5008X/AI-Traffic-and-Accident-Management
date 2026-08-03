const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { emitToAll, emitToUser, emitToIncident } = require('../services/socketService');

const alertController = {
  async create(req, res, next) {
    try {
      let usersReached = req.body.usersReached;
      if (usersReached === undefined || usersReached === null) {
        usersReached = await User.countDocuments({ role: 'user' });
      }

      const alert = await Alert.create({
        ...req.body,
        usersReached,
        broadcastBy: req.user ? req.user.id : null,
      });

      emitToAll('alert:broadcast', alert);
      return sendSuccess(res, alert, 201);
    } catch (err) {
      next(err);
    }
  },

  async getActive(req, res, next) {
    try {
      const alerts = await Alert.find({ active: true }).sort({ createdAt: -1 });
      return sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const alerts = await Alert.find({}).sort({ createdAt: -1 });
      return sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  },

  async getMyAlerts(req, res, next) {
    try {
      if (!req.user) return sendSuccess(res, []);
      const alerts = await Alert.find({
        $or: [
          { targetUser: req.user.id.toString() },
          { targetUser: null }, // global broadcasts
        ],
        active: true,
      }).sort({ createdAt: -1 });

      return sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  },

  async sendIncidentNotification(req, res, next) {
    try {
      const { incidentId, message, skipChat } = req.body;
      if (!incidentId || !message) {
        return sendError(res, 'incidentId and message are required', 400);
      }

      const incident = await Incident.findById(incidentId);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      const targetUserId = incident.reportedBy ? incident.reportedBy.toString() : null;

      // 1. Store chat message on incident (optional)
      if (!skipChat) {
        const chatItem = {
          message,
          senderRole: 'relief_admin',
          senderId: req.user ? req.user.id : null,
          senderName: req.user ? req.user.name : 'Relief Center',
          timestamp: new Date(),
        };
        incident.chat.push(chatItem);
        await incident.save();

        await Message.create({
          incidentId,
          content: message,
          senderRole: 'relief_admin',
          senderName: chatItem.senderName,
          senderId: chatItem.senderId,
        });

        emitToIncident(incidentId, 'chat:message', {
          incidentId,
          ...chatItem,
        });
      }

      // 2. Create targeted alert notification for the reporter
      const alert = await Alert.create({
        type: 'relief_center_message',
        message: `[Relief Center] ${message}`,
        severity: 'medium',
        broadcastBy: req.user ? req.user.id : null,
        targetUser: targetUserId,
        incidentId,
      });

      if (targetUserId) {
        emitToUser(targetUserId, 'alert:personal', alert);
      }

      return sendSuccess(res, { success: true, alert }, 201);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { $set: { active: false, cancelledAt: new Date() } },
        { new: true }
      );
      if (!alert) {
        return sendError(res, 'Alert not found', 404);
      }
      emitToAll('alert:cancelled', alert);
      return sendSuccess(res, alert);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      if (!alert) {
        return sendError(res, 'Alert not found', 404);
      }
      return sendSuccess(res, alert);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = alertController;
