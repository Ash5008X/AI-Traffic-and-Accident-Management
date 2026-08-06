const User = require('../models/User');

/**
 * UserRepository
 * Encapsulates all database operations for User accounts.
 */
class UserRepository {
  static async create(userData) {
    return await User.create(userData);
  }

  static async findById(id) {
    return await User.findById(id);
  }

  static async findOne(filter = {}) {
    return await User.findOne(filter);
  }

  static async find(filter = {}, { lean = true } = {}) {
    let query = User.find(filter);
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await User.findByIdAndUpdate(id, updateData, options);
  }
}

module.exports = UserRepository;
