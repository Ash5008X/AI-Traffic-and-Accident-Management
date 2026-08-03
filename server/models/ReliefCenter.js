const mongoose = require('mongoose');

const reliefCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Relief center name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      default: 'relief_admin',
    },
    location: {
      lat: { type: Number, default: 19.076 },
      lng: { type: Number, default: 72.8777 },
      address: { type: String, default: 'Central Relief Command' },
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FieldUnit',
      },
    ],
    unassignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
    status: {
      type: String,
      enum: ['on_duty', 'off_duty', 'busy', 'standby'],
      default: 'on_duty',
    },
  },
  {
    timestamps: true,
    collection: 'relief_centers',
  }
);

reliefCenterSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('ReliefCenter', reliefCenterSchema);
