const mongoose = require('mongoose');

const fieldUnitSchema = new mongoose.Schema(
  {
    unitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['AMBULANCE', 'PATROL_CAR', 'TOW_TRUCK', 'HAZMAT', 'RESCUE'],
      default: 'PATROL_CAR',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'en_route', 'on_site', 'returning', 'busy', 'offline'],
      default: 'available',
    },
    assignedIncidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
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
      lat: { type: Number },
      lng: { type: Number },
    },
    shiftStart: {
      type: Date,
      default: Date.now,
    },
    missionsToday: {
      type: Number,
      default: 0,
    },
    updates: [
      {
        timestamp: { type: Date, default: Date.now },
        text: String,
      },
    ],
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'field_units',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility Virtual Aliases
fieldUnitSchema.virtual('currentIncident').get(function () {
  return this.assignedIncidentId;
}).set(function (v) {
  this.assignedIncidentId = v;
});

// Pre-save hook to populate name and sync coordinates
fieldUnitSchema.pre('save', function (next) {
  if (!this.name && this.unitId) {
    this.name = `Unit ${this.unitId}`;
  }
  if (this.location && this.location.lat != null) {
    this.latitude = this.location.lat;
  }
  if (this.location && this.location.lng != null) {
    this.longitude = this.location.lng;
  }
  next();
});

// Indexes for operational queries
fieldUnitSchema.index({ status: 1 });
fieldUnitSchema.index({ reliefCenterId: 1 });

module.exports = mongoose.model('FieldUnit', fieldUnitSchema);
