const Incident = require('../models/Incident');

/**
 * IncidentRepository
 * Encapsulates all database operations, queries, population chains, and sorting for Incidents.
 */
class IncidentRepository {
  static async create(incidentData) {
    return await Incident.create(incidentData);
  }

  static async findById(id, { populate = true } = {}) {
    let query = Incident.findById(id);
    if (populate) {
      query = query
        .populate('reliefCenterId', 'name location')
        .populate('assignedTeamId', 'teamName name status members')
        .populate('assignedUnit', 'unitId name status')
        .populate('reportedBy', 'name email');
    }
    return await query.exec();
  }

  static async findByIncidentId(incidentId, { populate = true } = {}) {
    let query = Incident.findOne({ incidentId });
    if (populate) {
      query = query
        .populate('reliefCenterId', 'name location')
        .populate('assignedTeamId', 'teamName name status members')
        .populate('assignedUnit', 'unitId name status')
        .populate('reportedBy', 'name email');
    }
    return await query.lean();
  }

  static async find(filter = {}, { sort = { createdAt: -1 }, limit = null, populate = false, lean = true } = {}) {
    let query = Incident.find(filter).sort(sort);
    if (limit) {
      query = query.limit(limit);
    }
    if (populate) {
      query = query
        .populate('reliefCenterId', 'name location')
        .populate('assignedTeamId', 'teamName name status')
        .populate('assignedUnit', 'unitId name status')
        .populate('reportedBy', 'name email');
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async countDocuments(filter = {}) {
    return await Incident.countDocuments(filter);
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Incident.findByIdAndUpdate(id, updateData, options);
  }

  static async updateStatus(id, status, extraFields = {}) {
    return await Incident.findByIdAndUpdate(
      id,
      { $set: { status, ...extraFields } },
      { new: true }
    );
  }
}

module.exports = IncidentRepository;
