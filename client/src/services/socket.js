/**
 * Socket.io singleton manager with ES Module imports and graceful fallback.
 */
import { io } from 'socket.io-client';
import { API_BASE, AUTH_KEY } from '../utils/constants';

let socket = null;

const socketManager = {
  connect(token) {
    if (socket) return socket;
    try {
      const authToken = token || (localStorage.getItem(AUTH_KEY) ? JSON.parse(localStorage.getItem(AUTH_KEY))?.token : null);
      if (!authToken) return null;

      const socketUrl = API_BASE.replace(/\/api\/?$/, '');
      socket = io(socketUrl, {
        auth: { token: authToken },
        autoConnect: true,
        reconnectionAttempts: 3,
      });

      socket.on('connect', () => {
        console.log('Tactical link established: WebSocket connected.');
      });

      socket.on('disconnect', () => {
        console.log('Tactical link severed: WebSocket disconnected.');
      });

      socket.on('connect_error', () => {
        console.warn('WebSocket connection failed — running in fallback mode.');
      });

      return socket;
    } catch {
      console.warn('Socket.io not available — real-time features disabled.');
      return null;
    }
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  on(event, callback) {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off(event, callback) {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit(event, data) {
    if (socket) {
      socket.emit(event, data);
    }
  },
};

export default socketManager;
