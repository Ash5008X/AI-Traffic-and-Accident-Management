const FieldUnit = require('../models/FieldUnit');
const Incident = require('../models/Incident');
const Member = require('../models/Member');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { emitToAll } = require('../services/socketService');

const fieldUnitController = {
  async getAll(req, res, next) {
    try {
      const units = await FieldUnit.find({}).populate('agentId', 'name email phone specialization');
      return sendSuccess(res, units);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      let unit = await FieldUnit.findById(req.params.id).populate('agentId', 'name email phone specialization');
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id }).populate('agentId', 'name email phone specialization');
      }
      if (!unit) {
        return sendError(res, 'Field unit not found', 404);
      }
      return sendSuccess(res, unit);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit) {
        return sendError(res, 'Field unit not found', 404);
      }

      unit.status = status;
      await unit.save();

      emitToAll('unit:statusChanged', { unitId: unit.unitId, status });
      return sendSuccess(res, unit);
    } catch (err) {
      next(err);
    }
  },

  async markArrived(req, res, next) {
    try {
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit) {
        return sendError(res, 'Field unit not found', 404);
      }
      if (!unit.currentIncident) {
        return sendError(res, 'No current incident assigned to this unit', 400);
      }

      unit.status = 'on_site';
      await unit.save();

      const incident = await Incident.findByIdAndUpdate(
        unit.currentIncident,
        { $set: { status: 'on_site' } },
        { new: true }
      );

      emitToAll('unit:statusChanged', { unitId: unit.unitId, status: 'on_site' });
      if (incident) {
        emitToAll('incident:updated', incident);
      }

      return sendSuccess(res, unit);
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const { lat, lng } = req.body;
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit) {
        return sendError(res, 'Field unit not found', 404);
      }

      unit.location = { lat: Number(lat), lng: Number(lng) };
      await unit.save();

      if (unit.agentId) {
        await Member.findByIdAndUpdate(unit.agentId, {
          $set: { 'location.lat': Number(lat), 'location.lng': Number(lng) },
        });
      }

      emitToAll('unit:locationUpdated', { unitId: unit.unitId, lat: Number(lat), lng: Number(lng) });
      return sendSuccess(res, unit);
    } catch (err) {
      next(err);
    }
  },

  async getAssigned(req, res, next) {
    try {
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit || !unit.currentIncident) {
        return sendSuccess(res, null);
      }

      const incident = await Incident.findById(unit.currentIncident);
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async getUpdates(req, res, next) {
    try {
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit) {
        return sendSuccess(res, []);
      }

      return sendSuccess(res, unit.updates || []);
    } catch (err) {
      next(err);
    }
  },

  async getProfileStats(req, res, next) {
    try {
      let unit = await FieldUnit.findById(req.params.id);
      if (!unit && req.params.id.length === 24) {
        unit = await FieldUnit.findOne({ agentId: req.params.id });
      }
      if (!unit) {
        return sendError(res, 'Field unit not found', 404);
      }

      return sendSuccess(res, {
        unitId: unit.unitId,
        status: unit.status,
        missionsToday: unit.missionsToday || 0,
        currentIncident: unit.currentIncident || null,
        shiftStart: unit.shiftStart || null,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = fieldUnitController;
