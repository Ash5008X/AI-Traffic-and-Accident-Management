const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ReliefCenter = require('../models/ReliefCenter');
const Member = require('../models/Member');
const FieldUnit = require('../models/FieldUnit');
const {
  findUserAcrossCollections,
  findUserByIdAcrossCollections,
  assignFieldUnitToNearestAdmin,
} = require('../services/authService');
const { findNearbyReliefCenter } = require('../services/reliefCenterService');
const { validateRegister, validateLogin, validateReliefAdminRegister } = require('../validators/schemas');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const authController = {
  async register(req, res, next) {
    try {
      const validationError = validateRegister(req.body);
      if (validationError) {
        return sendError(res, validationError, 400);
      }

      const { name, email, password, role, location, phone, specialization, latitude, longitude } = req.body;

      // Check if user already exists in any collection
      const existing = await findUserAcrossCollections(email);
      if (existing) {
        return sendError(res, 'An account with this email already exists.', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let user;

      if (role === 'relief_admin') {
        // Validate coordinates for Relief Center registration
        const coordError = validateReliefAdminRegister(req.body);
        if (coordError) {
          return sendError(res, coordError, 400);
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        // Check if another Relief Center exists within 3 km
        const nearbyCenter = await findNearbyReliefCenter(lng, lat, 3000);
        if (nearbyCenter) {
          return sendError(
            res,
            'Another relief center already exists within 3 km of this location.',
            409
          );
        }

        user = await ReliefCenter.create({
          name,
          email,
          password: hashedPassword,
          role: 'relief_admin',
          location: { lat, lng, address: '' },
          geoLocation: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
          },
          status: 'on_duty',
        });
      } else if (role === 'field_unit') {
        user = await Member.create({
          name,
          email,
          password: hashedPassword,
          role: 'field_unit',
          location: location || { lat: null, lng: null, address: 'Mobile Unit' },
          phone: phone || '',
          specialization: specialization || 'General Patrol',
          status: 'active',
        });

        // Create an operational FieldUnit entry linked to this member
        const unitIdStr = `UNIT-${Date.now().toString(36).toUpperCase()}`;
        await FieldUnit.create({
          unitId: unitIdStr,
          agentId: user._id,
          status: 'available',
          location: user.location,
        });

        // Auto-assign to nearest Relief Admins within 5km
        await assignFieldUnitToNearestAdmin(user._id, user.location);
      } else {
        // default 'user'
        user = await User.create({
          name,
          email,
          password: hashedPassword,
          role: 'user',
          location: location || { lat: null, lng: null, address: '' },
          preferences: { notifications: true, smsUpdates: false },
        });
      }

      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'nexustraffic_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      return sendSuccess(res, { token, user: user.toJSON() }, 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const validationError = validateLogin(req.body);
      if (validationError) {
        return sendError(res, validationError, 400);
      }

      const { email, password } = req.body;
      const found = await findUserAcrossCollections(email);
      if (!found) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const isMatch = await bcrypt.compare(password, found.user.password);
      if (!isMatch) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const token = jwt.sign(
        {
          id: found.user._id,
          name: found.user.name,
          email: found.user.email,
          role: found.user.role,
        },
        process.env.JWT_SECRET || 'nexustraffic_super_secret_jwt_key_2026',
        { expiresIn: '7d' }
      );

      return sendSuccess(res, { token, user: found.user.toJSON() });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const found = await findUserByIdAcrossCollections(req.user.id, req.user.role);
      if (!found) {
        return sendError(res, 'User profile not found.', 404);
      }
      return sendSuccess(res, found.user.toJSON());
    } catch (err) {
      next(err);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const { preferences } = req.body;
      const updated = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { preferences } },
        { new: true }
      );
      if (!updated) {
        return sendError(res, 'User not found.', 404);
      }
      return sendSuccess(res, updated.toJSON());
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const location = req.body.location || {
        lat: req.body.lat,
        lng: req.body.lng,
        address: req.body.address || '',
      };

      if (location.lat == null || location.lng == null) {
        return sendError(res, 'Valid lat and lng coordinates are required.', 400);
      }

      let updated = null;
      if (req.user.role === 'relief_admin') {
        return sendError(res, 'Relief Center location is locked and cannot be modified during routine operations.', 403);
      } else if (req.user.role === 'field_unit') {
        updated = await Member.findByIdAndUpdate(
          req.user.id,
          { $set: { location } },
          { new: true }
        );
        await FieldUnit.findOneAndUpdate(
          { agentId: req.user.id },
          { $set: { 'location.lat': location.lat, 'location.lng': location.lng } },
          { new: true }
        );
      } else {
        updated = await User.findByIdAndUpdate(
          req.user.id,
          { $set: { location } },
          { new: true }
        );
      }

      if (!updated) {
        return sendError(res, 'User profile not found.', 404);
      }
      return sendSuccess(res, updated.toJSON());
    } catch (err) {
      next(err);
    }
  },

  async getFieldUnits(req, res, next) {
    try {
      const units = await FieldUnit.find({}).populate('agentId', 'name email phone specialization');
      return sendSuccess(res, units);
    } catch (err) {
      next(err);
    }
  },

  async getUserCount(req, res, next) {
    try {
      const count = await User.countDocuments({ role: 'user' });
      return sendSuccess(res, { count });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
