const mongoose = require('mongoose');

const reliefCenterSchema = new mongoose.Schema(
  {
    reliefCenterId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Relief Center name is required'],
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
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
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
    // GeoJSON location for geospatial queries (proximity checks, etc.)
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  {
    timestamps: true,
    collection: 'relief_centers',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance & geospatial search (email and reliefCenterId use unique field indexes)
reliefCenterSchema.index({ geoLocation: '2dsphere' });

// Pre-save hook: Keep location.lat/lng and latitude/longitude and GeoJSON synced
reliefCenterSchema.pre('save', function (next) {
  if (!this.reliefCenterId) {
    this.reliefCenterId = `RC-${this._id.toString().slice(-6).toUpperCase()}`;
  }

  const latVal = this.location?.lat ?? this.latitude;
  const lngVal = this.location?.lng ?? this.longitude;

  if (latVal != null && lngVal != null) {
    this.latitude = latVal;
    this.longitude = lngVal;
    if (!this.location) {
      this.location = { lat: latVal, lng: lngVal, address: 'Central Relief Command' };
    } else {
      this.location.lat = latVal;
      this.location.lng = lngVal;
    }
    this.geoLocation = {
      type: 'Point',
      coordinates: [lngVal, latVal],
    };
  }
  next();
});

module.exports = mongoose.model('ReliefCenter', reliefCenterSchema);
