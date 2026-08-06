const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['incident', 'assignment', 'update', 'system', 'alert', 'broadcast'],
      default: 'system',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    broadcastId: {
      type: String,
      default: null,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    targetZone: {
      type: String,
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility Virtual Aliases
notificationSchema.virtual('receiver').get(function () {
  return this.receiverId;
}).set(function (v) {
  this.receiverId = v;
});

notificationSchema.virtual('relatedIncident').get(function () {
  return this.incidentId;
}).set(function (v) {
  this.incidentId = v;
});

// Pre-save hook to generate notificationId if missing
notificationSchema.pre('save', function (next) {
  if (!this.notificationId) {
    this.notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }
  next();
});

// Indexes for faster notification dropdown and unread counting queries
notificationSchema.index({ receiverId: 1, createdAt: -1 });
notificationSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
