const IncidentRepository = require('../repositories/IncidentRepository');
const FieldUnitRepository = require('../repositories/FieldUnitRepository');
const TeamRepository = require('../repositories/TeamRepository');
const NotificationService = require('./NotificationService');
const { emitToAll } = require('./socketService');

/**
 * DispatchService
 * Responsible exclusively for response unit dispatches, team assignments,
 * assignment requests, and backup requests.
 */
class DispatchService {
  /**
   * Accepts and dispatches a unit/team to an incident site.
   */
  static async accept(id, { unitId, teamId }, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    incident.status = 'en_route';
    incident.dispatchedAt = new Date();
    if (reqUser && reqUser.id) {
      incident.dispatchedBy = reqUser.id;
    }

    if (unitId) {
      incident.assignedUnit = unitId;
      await FieldUnitRepository.findByIdAndUpdate(unitId, {
        $set: { status: 'en_route', assignedIncidentId: incident._id, currentIncident: incident._id },
      });
    }
    if (teamId) {
      incident.assignedTeamId = teamId;
      await TeamRepository.findByIdAndUpdate(teamId, {
        $set: { status: 'BUSY' },
      });
    }

    incident.actions.push({
      type: 'unit_dispatched',
      performedBy: reqUser ? reqUser.id : null,
      details: 'Unit dispatched to site',
      timestamp: new Date(),
    });

    await incident.save();
    emitToAll('incident:updated', incident);
    return incident;
  }

  /**
   * Field unit requests assignment to an incident.
   */
  static async requestAssignment(id, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    incident.actions.push({
      type: 'assignment_request',
      performedBy: reqUser ? reqUser.id : null,
      details: 'Field unit requested assignment',
      timestamp: new Date(),
    });
    await incident.save();

    emitToAll('incident:updated', incident);
    return incident;
  }

  /**
   * Field unit requests backup for an incident.
   */
  static async backupRequest(id, details, reqUser) {
    const incident = await IncidentRepository.findById(id, { populate: false });
    if (!incident) return null;

    incident.actions.push({
      type: 'backup_request',
      performedBy: reqUser ? reqUser.id : null,
      details: details || 'Backup requested by field unit',
      timestamp: new Date(),
    });
    await incident.save();

    if (incident.reliefCenterId) {
      await NotificationService.create({
        title: 'Backup Requested',
        message: `[Field Unit] Backup required at the site (ID: ${incident.incidentId})`,
        type: 'system',
        priority: 'high',
        receiver: incident.reliefCenterId,
        sender: reqUser ? reqUser.id : null,
        relatedIncident: incident._id,
      });
    }

    emitToAll('incident:updated', incident);
    return incident;
  }
}

module.exports = DispatchService;
