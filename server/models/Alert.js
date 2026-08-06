const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    broadcastId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      default: 'ALERT BROADCAST',
      trim: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    targetZone: {
      type: String,
      default: 'All Zones',
    },
    message: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Delivered', 'Sending', 'Failed'],
      default: 'Delivered',
    },
    active: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'alerts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility Virtual Aliases
alertSchema.virtual('zone').get(function () {
  return this.targetZone;
}).set(function (v) {
  this.targetZone = v;
});

alertSchema.virtual('broadcastBy').get(function () {
  return this.createdBy;
}).set(function (v) {
  this.createdBy = v;
});

// Indexes for query performance
alertSchema.index({ active: 1, createdAt: -1 });
alertSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Alert', alertSchema);
