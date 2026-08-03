const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      default: () => `NX-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    title: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Incident type is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'warning', 'info', 'normal'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'en_route', 'on_site', 'resolved', 'dismissed', 'dispatched'],
      default: 'pending',
    },
    zone: {
      type: String,
      default: 'SECTOR-N',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    description: {
      type: String,
      default: '',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reliefCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    assignedTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    assignedUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FieldUnit',
      default: null,
    },
    resources: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    actions: [
      {
        type: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId },
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    chat: [
      {
        message: String,
        senderRole: String,
        senderId: mongoose.Schema.Types.ObjectId,
        senderName: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'incidents',
  }
);

// Performance indexes for frequent dashboard, feed, and reporting queries
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ reliefCenterId: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
