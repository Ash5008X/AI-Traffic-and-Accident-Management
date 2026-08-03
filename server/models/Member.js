const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
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
      default: 'field_unit',
    },
    location: {
      lat: { type: Number, default: 19.076 },
      lng: { type: Number, default: 72.8777 },
      address: { type: String, default: '' },
    },
    phone: {
      type: String,
      default: '',
    },
    specialization: {
      type: String,
      default: 'General Patrol',
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

module.exports = mongoose.model('Member', memberSchema);
