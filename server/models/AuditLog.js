const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      unique: true,
      required: true,
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      trim: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    performerRole: {
      type: String,
      default: 'system',
    },
    reliefCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

// Performance indexes for history & auditing queries
auditLogSchema.index({ actionType: 1, createdAt: -1 });
auditLogSchema.index({ reliefCenterId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
