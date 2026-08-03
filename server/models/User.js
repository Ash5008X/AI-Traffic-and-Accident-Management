const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
      enum: ['user', 'relief_admin', 'field_unit'],
      default: 'user',
    },
    location: {
      lat: { type: Number, default: 19.076 },
      lng: { type: Number, default: 72.8777 },
      address: { type: String, default: '' },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      smsUpdates: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Exclude password from JSON output by default
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
