const Alert = require('../models/Alert');

/**
 * AlertRepository
 * Encapsulates all database operations for Alert broadcasts.
 */
class AlertRepository {
  static async create(alertData) {
    return await Alert.create(alertData);
  }

  static async findById(id) {
    return await Alert.findById(id);
  }

  static async find(filter = {}, { sort = { createdAt: -1 }, limit = null, populate = false, lean = true } = {}) {
    let query = Alert.find(filter).sort(sort);
    if (limit) {
      query = query.limit(limit);
    }
    if (populate) {
      query = query.populate('createdBy', 'name email');
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Alert.findByIdAndUpdate(id, updateData, options);
  }

  static async countDocuments(filter = {}) {
    return await Alert.countDocuments(filter);
  }
}

module.exports = AlertRepository;
