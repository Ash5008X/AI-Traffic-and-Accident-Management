const Message = require('../models/Message');
const Incident = require('../models/Incident');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { emitToIncident } = require('../services/socketService');

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

      const msg = await Message.create({
        incidentId,
        content,
        senderRole: senderRole || (req.user ? req.user.role : 'user'),
        senderName: senderName || (req.user ? req.user.name : 'Dispatcher'),
        senderId: req.user ? req.user.id : null,
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

      return sendSuccess(res, msg, 201);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = messageController;
