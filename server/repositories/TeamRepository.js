const Team = require('../models/Team');

/**
 * TeamRepository
 * Encapsulates all database operations for Response Teams.
 */
class TeamRepository {
  static async findById(id) {
    return await Team.findById(id);
  }

  static async find(filter = {}, { lean = true } = {}) {
    let query = Team.find(filter);
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Team.findByIdAndUpdate(id, updateData, options);
  }
}

module.exports = TeamRepository;
