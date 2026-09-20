const IncidentRepository = require('../repositories/IncidentRepository');
const MessageRepository = require('../repositories/MessageRepository');
const FieldUnitRepository = require('../repositories/FieldUnitRepository');
const LocationService = require('./LocationService');
const ZoneService = require('./ZoneService');
const AssignmentService = require('./AssignmentService');
const NotificationService = require('./notificationService');
const { emitToAll, emitToUser } = require('./socketService');
const { generateDeterministicIncidentId } = require('../utils/incidentIdGenerator');

/**
 * IncidentService
 * Responsible exclusively for incident lifecycle: creation, retrieval, status updates, and dismissals.
 * Delegates routing to AssignmentService and notifications to NotificationService.
 */
class IncidentService {
  /**
   * Creates an incident, delegates routing to AssignmentService, generates ID, and persists.
   */
  static async create(payload, reqUser) {
    const { title, type, severity, location, description, resources } = payload;

    const incidentData = {
      title: title || `${type} at ${location.address || 'Reported Location'}`,
      type,
      severity: severity || 'medium',
      location,
      description: description || '',
      resources: resources || [],
      reportedBy: reqUser ? reqUser.id : null,
    };

    // Delegate center assignment to AssignmentService
    const routing = await AssignmentService.assignToNearestCenter(location);
    incidentData.reliefCenterId = routing.reliefCenterId;
    incidentData.assignedReliefCenterId = routing.reliefCenterId;
    incidentData.zone = routing.zone;
    incidentData.assignedZone = routing.zone;
    incidentData.distanceToCenter = routing.distanceKm;
    incidentData.isOutsideCoverage = routing.isOutsideCoverage;

    incidentData.incidentId = await generateDeterministicIncidentId(
      incidentData.zone,
      new Date()
    );

    const incident = await IncidentRepository.create(incidentData);
    emitToAll('incident:new', incident);
    console.log(`[IncidentService] New report saved: ${incident.incidentId} (${incident.zone}) Center: ${incident.reliefCenterId}`);

    return incident;
  }

  /**
   * Fetches all incidents belonging to the user's assigned Relief Center.
   */
  static async getAll(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    const incidents = await IncidentRepository.find(centerFilter, { populate: true, lean: true });

    return incidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));
  }

  /**
   * Fetches an incident by MongoDB _id or human-readable incidentId string.
   */
  static async getById(id) {
    let incident;
    if (id.startsWith('ZA-') || id.startsWith('ZB-') || id.startsWith('ZC-') || id.startsWith('ZD-') || id.startsWith('ZE-') || id.startsWith('ZF-') || id.startsWith('NX-') || id.startsWith('Z')) {
      incident = await IncidentRepository.findByIncidentId(id, { populate: true });
    } else {
      incident = await IncidentRepository.findById(id, { populate: true });
    }

    if (!incident) return null;

    incident.zone = ZoneService.resolveZone(incident);
    incident.assignedZone = incident.zone;
    return incident;
  }

  /**
   * Fetches active nearby incidents for map overlay.
   */
  static async nearby(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    const incidents = await IncidentRepository.find({
      ...centerFilter,
      status: { $nin: ['resolved', 'dismissed'] },
    }, { lean: true });

    return incidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));
  }

  /**
   * Updates an incident status and triggers resolution side-effects.
   */
  static async updateStatus(id, status, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    incident.status = status;
    incident.actions.push({
      type: 'status_update',
      performedBy: reqUser ? reqUser.id : null,
      details: `Status updated to ${status}`,
      timestamp: new Date(),
    });

    if (status === 'resolved') {
      incident.resolvedAt = new Date();
      if (reqUser && reqUser.id) {
        incident.resolvedBy = reqUser.id;
      }

      // Notify Relief Center if resolved by field unit
      if (reqUser && reqUser.role !== 'relief_admin' && incident.reliefCenterId) {
        await NotificationService.create({
          title: 'Incident Resolved',
          message: `[Field Unit] Incident has been resolved by field team (ID: ${incident.incidentId})`,
          type: 'system',
          priority: 'medium',
          receiver: incident.reliefCenterId,
          sender: reqUser.id,
          relatedIncident: incident._id,
        });
      }

      // Notify reporter
      if (incident.reportedBy) {
        const msg = await MessageRepository.create({
          incidentId: incident._id,
          content: 'Incident successfully resolved by response team.',
          senderRole: 'system',
          senderName: 'Dispatch Command',
          receiverId: incident.reportedBy,
        });
        emitToUser(incident.reportedBy.toString(), 'notification:new', msg);
      }

      // Release assigned field unit
      if (incident.assignedUnit) {
        await FieldUnitRepository.findByIdAndUpdate(incident.assignedUnit, {
          $set: { status: 'available', assignedIncidentId: null, currentIncident: null },
        });
      }
    }

    await incident.save();
    emitToAll('incident:updated', incident);
    return incident;
  }

  /**
   * Dismisses an incident and releases assigned resources.
   */
  static async dismiss(id, dismissReason, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    incident.status = 'dismissed';
    incident.dismissedAt = new Date();
    incident.dismissReason = dismissReason || 'Dismissed by relief command';
    if (reqUser && reqUser.id) {
      incident.dismissedBy = reqUser.id;
    }

    incident.actions.push({
      type: 'dismissed',
      performedBy: reqUser ? reqUser.id : null,
      details: `Dismissed: ${incident.dismissReason}`,
      timestamp: new Date(),
    });

    // Release assigned field unit
    if (incident.assignedUnit) {
      await FieldUnitRepository.findByIdAndUpdate(incident.assignedUnit, {
        $set: { status: 'available', assignedIncidentId: null, currentIncident: null },
      });
    }

    await incident.save();
    emitToAll('incident:updated', incident);
    return incident;
  }
}

module.exports = IncidentService;
