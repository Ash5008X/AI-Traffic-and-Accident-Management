const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    zone: {
      type: String,
      required: [true, 'Sector/Zone is required'],
      default: 'SECTOR-N',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'ON-CALL', 'OFF-DUTY', 'BUSY'],
      default: 'ACTIVE',
    },
    incidentsHandled: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'teams',
  }
);

module.exports = mongoose.model('Team', teamSchema);
