const Team = require('../models/Team');
const ReliefCenter = require('../models/ReliefCenter');
const Member = require('../models/Member');
const { validateTeamCreation } = require('../validators/schemas');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const teamController = {
  async getAll(req, res, next) {
    try {
      const teams = await Team.find({})
        .populate('adminId', 'name email')
        .populate('members', 'name email phone specialization location status');
      return sendSuccess(res, teams);
    } catch (err) {
      next(err);
    }
  },

  async getByAdmin(req, res, next) {
    try {
      const teams = await Team.find({ adminId: req.user.id })
        .populate('adminId', 'name email')
        .populate('members', 'name email phone specialization location status');
      return sendSuccess(res, teams);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const validationError = validateTeamCreation(req.body);
      if (validationError) {
        return sendError(res, validationError, 400);
      }

      const { name, zone } = req.body;
      const team = await Team.create({
        name,
        zone,
        adminId: req.user ? req.user.id : null,
        members: [],
        status: 'ACTIVE',
      });

      return sendSuccess(res, team, 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteTeam(req, res, next) {
    try {
      const team = await Team.findByIdAndDelete(req.params.id);
      if (!team) {
        return sendError(res, 'Team not found', 404);
      }
      return sendSuccess(res, { success: true, message: 'Team deleted' });
    } catch (err) {
      next(err);
    }
  },

  async addMembers(req, res, next) {
    try {
      const { memberIds } = req.body;
      if (!Array.isArray(memberIds)) {
        return sendError(res, 'memberIds must be an array of Member IDs', 400);
      }

      const team = await Team.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { members: { $each: memberIds } } },
        { new: true }
      ).populate('members', 'name email phone specialization');

      if (!team) {
        return sendError(res, 'Team not found', 404);
      }
      return sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { memberId } = req.body;
      const team = await Team.findByIdAndUpdate(
        req.params.id,
        { $pull: { members: memberId } },
        { new: true }
      ).populate('members', 'name email phone specialization');

      if (!team) {
        return sendError(res, 'Team not found', 404);
      }
      return sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  },

  async getUnassignedFieldUnits(req, res, next) {
    try {
      let adminId = req.user ? req.user.id : null;
      if (!adminId) return sendSuccess(res, []);

      const admin = await ReliefCenter.findById(adminId);
      if (!admin || !admin.unassignedMembers || admin.unassignedMembers.length === 0) {
        return sendSuccess(res, []);
      }

      const members = await Member.find({ _id: { $in: admin.unassignedMembers } });
      return sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = teamController;
