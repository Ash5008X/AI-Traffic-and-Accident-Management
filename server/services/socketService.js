const jwt = require('jsonwebtoken');

let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  // JWT auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'nexustraffic_super_secret_jwt_key_2026'
        );
        socket.user = decoded;
      } catch (err) {
        // Allow unauthenticated sockets to connect without socket.user
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id} (${socket.user?.name || 'anonymous'})`);

    // Join role-based and user-specific rooms
    if (socket.user) {
      socket.join(`role:${socket.user.role}`);
      socket.join(`user:${socket.user.id}`);
    }

    // Join specific incident room
    socket.on('join:incident', ({ incidentId }) => {
      if (incidentId) {
        socket.join(`incident:${incidentId}`);
        console.log(`[Socket] ${socket.user?.name || socket.id} joined incident room: ${incidentId}`);
      }
    });

    // Report incident
    socket.on('incident:report', (data) => {
      io.to('role:relief_admin').emit('incident:new', data);
    });

    // Accept incident
    socket.on('incident:accept', (data) => {
      io.emit('incident:updated', data);
    });

    // Mark en route
    socket.on('incident:markEnRoute', (data) => {
      io.emit('incident:updated', { ...data, status: 'en_route' });
    });

    // Mark resolved
    socket.on('incident:markResolved', (data) => {
      io.emit('incident:updated', { ...data, status: 'resolved' });
    });

    // Chat messages
    socket.on('chat:send', (data) => {
      const msg = {
        ...data,
        senderName: socket.user?.name || 'Unknown',
        timestamp: new Date(),
      };
      if (data && data.incidentId) {
        io.to(`incident:${data.incidentId}`).emit('chat:message', msg);
      }
    });

    // Unit location update
    socket.on('unit:updateLocation', (data) => {
      io.to('role:relief_admin').emit('unit:locationUpdated', data);
      io.to('role:relief_admin').emit('field_unit:location_updated', data);
    });

    // Unit arrived
    socket.on('unit:arrived', (data) => {
      io.emit('unit:statusChanged', { ...data, status: 'on_site' });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

function emitToAll(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

function emitToRole(role, event, data) {
  if (ioInstance) {
    ioInstance.to(`role:${role}`).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  }
}

function emitToIncident(incidentId, event, data) {
  if (ioInstance && incidentId) {
    ioInstance.to(`incident:${incidentId.toString()}`).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToAll,
  emitToRole,
  emitToUser,
  emitToIncident,
};
