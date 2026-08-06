const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: 'Field Officer',
      trim: true,
    },
    specialization: {
      type: String,
      default: 'General Patrol',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      default: 'field_unit',
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    reliefCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReliefCenter',
      default: null,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'standby', 'off_duty'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    collection: 'members',
  }
);

memberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes for relationship resolution & performance
memberSchema.index({ teamId: 1 });
memberSchema.index({ reliefCenterId: 1 });

module.exports = mongoose.model('Member', memberSchema);
