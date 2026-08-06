const Member = require('../models/Member');

/**
 * MemberRepository
 * Encapsulates all database operations for Members / Field Unit Users.
 */
class MemberRepository {
  static async create(memberData) {
    return await Member.create(memberData);
  }

  static async findById(id) {
    return await Member.findById(id);
  }

  static async findOne(filter = {}) {
    return await Member.findOne(filter);
  }

  static async find(filter = {}, { lean = true } = {}) {
    let query = Member.find(filter);
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Member.findByIdAndUpdate(id, updateData, options);
  }
}

module.exports = MemberRepository;
