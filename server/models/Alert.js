const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      default: 'SYSTEM BROADCAST',
      trim: true,
    },
    message: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['info', 'medium', 'warning', 'high', 'critical', 'success', 'normal'],
      default: 'info',
    },
    zone: {
      type: String,
      default: 'ALL SECTORS',
    },
    broadcastBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetUser: {
      type: String,
      default: null,
    },
    incidentId: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    usersReached: {
      type: Number,
      default: 0,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'alerts',
  }
);

module.exports = mongoose.model('Alert', alertSchema);
