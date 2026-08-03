const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'relief_admin', 'field_unit'],
      default: 'relief_admin',
    },
    senderName: {
      type: String,
      default: 'Dispatch Command',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

module.exports = mongoose.model('Message', messageSchema);
