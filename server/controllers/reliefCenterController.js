const ReliefCenter = require('../models/ReliefCenter');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const reliefCenterController = {
  async getAll(req, res, next) {
    try {
      const centers = await ReliefCenter.find({}).select('-password');
      return sendSuccess(res, centers);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const center = await ReliefCenter.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true }
      ).select('-password');

      if (!center) {
        return sendError(res, 'Relief center not found', 404);
      }
      return sendSuccess(res, center);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reliefCenterController;
