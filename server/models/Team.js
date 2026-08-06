const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      unique: true,
      sparse: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    teamType: {
      type: String,
      default: 'RAPID_RESPONSE',
    },
    assignedZone: {
      type: String,
      required: [true, 'Assigned zone is required'],
      default: 'Zone A',
    },
    reliefCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    memberIds: [
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility Virtual Aliases
teamSchema.virtual('name').get(function () {
  return this.teamName;
}).set(function (v) {
  this.teamName = v;
});

teamSchema.virtual('zone').get(function () {
  return this.assignedZone;
}).set(function (v) {
  this.assignedZone = v;
});

teamSchema.virtual('adminId').get(function () {
  return this.reliefCenterId;
}).set(function (v) {
  this.reliefCenterId = v;
});

teamSchema.virtual('members').get(function () {
  return this.memberIds;
}).set(function (v) {
  this.memberIds = v;
});

// Indexes for performance
teamSchema.index({ assignedZone: 1, status: 1 });
teamSchema.index({ reliefCenterId: 1 });

module.exports = mongoose.model('Team', teamSchema);
