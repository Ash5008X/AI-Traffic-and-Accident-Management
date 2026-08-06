const CommunicationService = require('../../services/CommunicationService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Communication Controller (Thin Controller)
 * Delegates in-incident chat and action history logging to CommunicationService.
 */
module.exports = {
  async addChat(req, res, next) {
    try {
      const chatItem = await CommunicationService.addChat(req.params.id, req.body, req.user);
      if (!chatItem) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, chatItem, 201);
    } catch (err) {
      next(err);
    }
  },

  async addAction(req, res, next) {
    try {
      const actionItem = await CommunicationService.addAction(req.params.id, req.body, req.user);
      if (!actionItem) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, actionItem, 201);
    } catch (err) {
      next(err);
    }
  },
};
