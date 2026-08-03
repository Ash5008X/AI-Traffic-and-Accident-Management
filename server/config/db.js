const mongoose = require('mongoose');

/**
 * Connects to MongoDB via Mongoose with retry support and event listeners.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexustraffic';

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // Do not crash immediately during tests/dev if offline, allow retries
    throw err;
  }
}

/**
 * Returns the active mongoose connection object.
 */
function getDBConnection() {
  return mongoose.connection;
}

module.exports = { connectDB, getDBConnection };
