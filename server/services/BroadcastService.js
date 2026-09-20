const AlertRepository = require('../repositories/AlertRepository');
const UserRepository = require('../repositories/UserRepository');
const NotificationService = require('./notificationService');
const ZoneService = require('./ZoneService');
const LocationService = require('./LocationService');
const { emitToAll } = require('./socketService');
const { generateBroadcastId } = require('../utils/broadcastIdGenerator');

function severityToPriority(severity) {
  switch (severity) {
    case 'critical': return 'critical';
    case 'warning': return 'high';
    case 'info':
    default: return 'medium';
  }
}

/**
 * BroadcastService
 * Responsible exclusively for broadcast alert creation, recipient targeting,
 * delivery, history, and lifecycle management.
 */
class BroadcastService {
  /**
   * Transmits a new broadcast alert to matching recipients.
   */
  static async createBroadcast({ title, type, severity, zone, message }, reqUser) {
    const { lat: centerLat, lng: centerLng } = await LocationService.getReliefCenterCoords(reqUser);

    const targetZone = zone ? ZoneService.normalizeZone(zone) : 'All Zones';
    const now = new Date();

    const broadcastId = await generateBroadcastId(targetZone, now);

    const alert = await AlertRepository.create({
      broadcastId,
      title: title || '',
      type: type || 'ALERT BROADCAST',
      severity: severity || 'info',
      zone: targetZone,
      message: message.trim(),
      createdBy: reqUser ? reqUser.id : null,
      active: true,
      recipientCount: 0,
      status: 'Delivered',
    });

    // Determine recipients based on zone targeting
    const isAllZones = !zone || zone === 'All Zones';
    const allUsers = await UserRepository.find({}, { lean: true });

    let recipients;
    if (isAllZones || centerLat == null || centerLng == null) {
      recipients = allUsers;
    } else {
      recipients = allUsers.filter((user) => {
        const userLat = user.location?.lat;
        const userLng = user.location?.lng;
        if (userLat == null || userLng == null) return false;
        const userZone = ZoneService.classifyZone(centerLat, centerLng, userLat, userLng);
        return userZone === targetZone;
      });
    }

    // Delegate notification creation to NotificationService
    const broadcastTitle = title || 'Alert Broadcast';
    const priority = severityToPriority(severity);

    const notificationPromises = recipients.map((user) =>
      NotificationService.create({
        title: broadcastTitle,
        message: message.trim(),
        type: 'broadcast',
        priority,
        receiver: user._id,
        sender: reqUser ? reqUser.id : null,
        broadcastId,
        targetZone,
      })
    );

    await Promise.all(notificationPromises);

    alert.recipientCount = recipients.length;
    await alert.save();

    emitToAll('alert:new', alert);
    emitToAll('broadcast:new', {
      broadcastId,
      alert,
      recipientsCount: recipients.length,
    });

    return alert;
  }

  /**
   * Retrieves broadcast transmission history.
   */
  static async getHistory(reqUser) {
    const filter = { broadcastId: { $exists: true, $ne: null } };
    if (reqUser && reqUser.role === 'relief_admin') {
      filter.createdBy = reqUser.id;
    }

    return await AlertRepository.find(filter, { populate: true, lean: true });
  }

  /**
   * Returns active broadcast alerts.
   */
  static async getActive() {
    return await AlertRepository.find({ active: true, broadcastId: { $exists: true, $ne: null } }, { lean: true });
  }

  /**
   * Returns broadcasts created by the user.
   */
  static async getMyAlerts(reqUser) {
    const filter = { broadcastId: { $exists: true, $ne: null } };
    if (reqUser && reqUser.id) {
      filter.createdBy = reqUser.id;
    }
    return await AlertRepository.find(filter, { lean: true });
  }

  /**
   * Cancels a broadcast alert.
   */
  static async cancel(id) {
    const alert = await AlertRepository.findById(id);
    if (!alert) return null;
    alert.active = false;
    alert.status = 'Cancelled';
    await alert.save();
    emitToAll('alert:updated', alert);
    return alert;
  }

  /**
   * Updates a broadcast alert document.
   */
  static async update(id, data) {
    const alert = await AlertRepository.findByIdAndUpdate(id, data, { new: true });
    if (!alert) return null;
    emitToAll('alert:updated', alert);
    return alert;
  }
}

module.exports = BroadcastService;
