require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Attach io to Express app instance for legacy req.app.get('io') compatibility
app.set('io', io);

// Initialize Socket service singleton
initSocket(io);

// Connect to Database & Start Server
async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`[NexusTRAFFIC] Server running on http://localhost:${PORT}`);
      console.log(`[NexusTRAFFIC] WebSocket server active`);
      console.log(`[NexusTRAFFIC] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error(`[Fatal] Failed to start server:`, err.message);
    process.exit(1);
  }
}

// Start only when executed directly
if (require.main === module) {
  startServer();
}

module.exports = { server, io, app };
