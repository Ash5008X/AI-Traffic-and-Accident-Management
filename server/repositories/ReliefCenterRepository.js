const ReliefCenter = require('../models/ReliefCenter');

/**
 * ReliefCenterRepository
 * Encapsulates all database operations for Relief Centers.
 */
class ReliefCenterRepository {
  static async create(centerData) {
    return await ReliefCenter.create(centerData);
  }

  static async findById(id, { select = '-password', lean = true } = {}) {
    let query = ReliefCenter.findById(id);
    if (select) {
      query = query.select(select);
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findOne(filter = {}, { select = '-password', lean = true } = {}) {
    let query = ReliefCenter.findOne(filter);
    if (select) {
      query = query.select(select);
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async find(filter = {}, { select = '-password', lean = true } = {}) {
    let query = ReliefCenter.find(filter);
    if (select) {
      query = query.select(select);
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await ReliefCenter.findByIdAndUpdate(id, updateData, options);
  }
}

module.exports = ReliefCenterRepository;
