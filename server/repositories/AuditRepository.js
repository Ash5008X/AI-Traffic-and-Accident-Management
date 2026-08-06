const AuditLog = require('../models/AuditLog');

/**
 * AuditRepository
 * Encapsulates all database operations for AuditLogs.
 */
class AuditRepository {
  static async create(auditData) {
    return await AuditLog.create(auditData);
  }

  static async find(filter = {}, { sort = { createdAt: -1 }, limit = null, lean = true } = {}) {
    let query = AuditLog.find(filter).sort(sort);
    if (limit) {
      query = query.limit(limit);
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async countDocuments(filter = {}) {
    return await AuditLog.countDocuments(filter);
  }
}

module.exports = AuditRepository;
