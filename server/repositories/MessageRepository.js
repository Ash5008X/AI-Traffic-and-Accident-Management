const Message = require('../models/Message');

/**
 * MessageRepository
 * Encapsulates all database operations for Messages.
 */
class MessageRepository {
  static async create(messageData) {
    return await Message.create(messageData);
  }

  static async find(filter = {}, { sort = { createdAt: 1 }, lean = true } = {}) {
    let query = Message.find(filter).sort(sort);
    if (lean) {
      query = query.lean();
    }
    return await query.exec();
  }
}

module.exports = MessageRepository;
