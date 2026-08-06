const IncidentRepository = require('../repositories/IncidentRepository');
const MessageRepository = require('../repositories/MessageRepository');
const { emitToIncident } = require('./socketService');

/**
 * CommunicationService
 * Handles in-incident chat messaging and action logging via Repositories.
 */
class CommunicationService {
  /**
   * Adds a chat message to an incident and creates a Message record via Repositories.
   */
  static async addChat(id, { message, senderRole, senderName }, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    const chatItem = {
      message,
      senderRole: senderRole || 'user',
      senderId: reqUser ? reqUser.id : null,
      senderName: senderName || (reqUser ? reqUser.name : 'Anonymous'),
      timestamp: new Date(),
    };

    incident.chat.push(chatItem);
    await incident.save();

    await MessageRepository.create({
      incidentId: id,
      content: message,
      senderRole: chatItem.senderRole,
      senderName: chatItem.senderName,
      senderId: chatItem.senderId,
    });

    emitToIncident(id, 'chat:message', {
      incidentId: id,
      ...chatItem,
    });

    return chatItem;
  }

  /**
   * Adds an operational action item to an incident's log history via Repositories.
   */
  static async addAction(id, { type, details }, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    const actionItem = {
      type: type || 'action',
      performedBy: reqUser ? reqUser.id : null,
      details: details || '',
      timestamp: new Date(),
    };

    incident.actions.push(actionItem);
    await incident.save();

    emitToIncident(id, 'action:new', {
      incidentId: id,
      ...actionItem,
    });

    return actionItem;
  }
}

module.exports = CommunicationService;
