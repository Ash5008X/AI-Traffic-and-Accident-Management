const AuditRepository = require('../repositories/AuditRepository');

/**
 * AuditService
 * Centralized service for append-only administrative and operational audit logging.
 */
class AuditService {
  static async log({
    actionType,
    entityType,
    entityId,
    performedBy = null,
    performerRole = 'system',
    reliefCenterId = null,
    previousData = null,
    newData = null,
    metadata = {},
    ipAddress = '',
    userAgent = '',
  }) {
    try {
      const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const logEntry = await AuditRepository.create({
        auditId,
        actionType,
        entityType,
        entityId,
        performedBy,
        performerRole,
        reliefCenterId,
        previousData,
        newData,
        metadata,
        ipAddress,
        userAgent,
      });
      return logEntry;
    } catch (err) {
      console.error('[AuditService] Failed to create audit log:', err.message);
      return null;
    }
  }
}

module.exports = AuditService;
