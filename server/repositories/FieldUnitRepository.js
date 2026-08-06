const FieldUnit = require('../models/FieldUnit');

/**
 * FieldUnitRepository
 * Encapsulates all database operations for FieldUnits.
 */
class FieldUnitRepository {
  static async create(unitData) {
    return await FieldUnit.create(unitData);
  }

  static async findById(id) {
    return await FieldUnit.findById(id);
  }

  static async find(filter = {}, { populate = true, lean = true } = {}) {
    let query = FieldUnit.find(filter);
    if (populate) {
      query = query.populate('agentId', 'name email phone specialization');
    }
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await FieldUnit.findByIdAndUpdate(id, updateData, options);
  }
}

module.exports = FieldUnitRepository;
