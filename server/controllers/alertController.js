const BroadcastService = require('../services/BroadcastService');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const alertController = {
  async create(req, res, next) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return sendError(res, 'Broadcast message is required', 400);
      }

      const alert = await BroadcastService.createBroadcast(req.body, req.user);
      return sendSuccess(res, alert, 201);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const broadcasts = await BroadcastService.getHistory(req.user);
      return sendSuccess(res, broadcasts);
    } catch (err) {
      next(err);
    }
  },

  async getActive(req, res, next) {
    try {
      const activeAlerts = await BroadcastService.getActive();
      return sendSuccess(res, activeAlerts);
    } catch (err) {
      next(err);
    }
  },

  async getMyAlerts(req, res, next) {
    try {
      const myAlerts = await BroadcastService.getMyAlerts(req.user);
      return sendSuccess(res, myAlerts);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const alert = await BroadcastService.cancel(req.params.id);
      if (!alert) {
        return sendError(res, 'Alert not found', 404);
      }
      return sendSuccess(res, alert);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const alert = await BroadcastService.update(req.params.id, req.body);
      if (!alert) {
        return sendError(res, 'Alert not found', 404);
      }
      return sendSuccess(res, alert);
    } catch (err) {
      next(err);
    }
  },

  async sendIncidentNotification(req, res, next) {
    try {
      const { incidentId, title, message, priority, targetZone } = req.body;

      if (!message || !message.trim()) {
        return sendError(res, 'Notification message is required', 400);
      }

      const allUsers = await User.find({}).lean();
      const notificationPromises = allUsers.map((user) =>
        notificationService.createNotification({
          title: title || 'Incident Alert',
          message: message.trim(),
          type: 'incident_alert',
          priority: priority || 'medium',
          receiver: user._id,
          sender: req.user ? req.user.id : null,
          relatedIncident: incidentId || null,
          targetZone: targetZone || null,
        })
      );

      await Promise.all(notificationPromises);

      return sendSuccess(res, {
        message: 'Notification sent successfully to all users',
        recipientCount: allUsers.length,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = alertController;
