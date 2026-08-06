const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      required: true,
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
      default: 'Zone A',
    },
    reliefCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
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
    distanceToCenter: {
      type: Number,
      default: 0,
    },
    isOutsideCoverage: {
      type: Boolean,
      default: false,
    },
    assignedTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    assignedUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FieldUnit',
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
    dismissedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dismissReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'incidents',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility Virtual Aliases
incidentSchema.virtual('assignedZone').get(function () {
  return this.zone;
}).set(function (v) {
  this.zone = v;
});

incidentSchema.virtual('assignedReliefCenterId').get(function () {
  return this.reliefCenterId;
}).set(function (v) {
  this.reliefCenterId = v;
});

// Sync latitude/longitude with location object on save
incidentSchema.pre('save', function (next) {
  if (this.location && this.location.lat != null) {
    this.latitude = this.location.lat;
  } else if (this.latitude != null && (!this.location || this.location.lat == null)) {
    this.location = this.location || {};
    this.location.lat = this.latitude;
  }
  if (this.location && this.location.lng != null) {
    this.longitude = this.location.lng;
  } else if (this.longitude != null && (!this.location || this.location.lng == null)) {
    this.location = this.location || {};
    this.location.lng = this.longitude;
  }
  next();
});

// Performance indexes for frequent dashboard & query paths
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ reliefCenterId: 1 });
incidentSchema.index({ zone: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
