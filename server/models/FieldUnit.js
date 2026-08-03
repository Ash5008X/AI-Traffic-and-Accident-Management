const mongoose = require('mongoose');

const fieldUnitSchema = new mongoose.Schema(
  {
    unitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'en_route', 'on_site', 'returning', 'busy', 'offline'],
      default: 'available',
    },
    currentIncident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    location: {
      lat: { type: Number, default: 19.076 },
      lng: { type: Number, default: 72.8777 },
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
  }
);

module.exports = mongoose.model('FieldUnit', fieldUnitSchema);
