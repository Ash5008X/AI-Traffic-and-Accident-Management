const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      sparse: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['user', 'relief_admin', 'field_unit', 'system'],
      default: 'relief_admin',
    },
    senderName: {
      type: String,
      default: 'Dispatch Command',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['TEXT', 'SYSTEM', 'DISPATCH', 'STATUS_CHANGE', 'BROADCAST_REFERENCE'],
      default: 'TEXT',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// Pre-save hook to generate messageId if missing
messageSchema.pre('save', function (next) {
  if (!this.messageId) {
    this.messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }
  next();
});

// Indexes for high-volume messaging queries
messageSchema.index({ incidentId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
