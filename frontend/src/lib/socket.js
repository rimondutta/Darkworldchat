import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Create socket instance
export const socket = io(`${BASE_URL}`, {
  autoConnect: false,
  withCredentials: true,
});

// Connect socket with user ID
export const connectSocket = (userId) => {
  socket.auth = { userId };
  socket.connect();
};

// Disconnect socket
export const disconnectSocket = () => {
  socket.disconnect();
};

// Get online status
export const subscribeToOnlineStatus = (callback) => {
  socket.on('getOnlineUsers', (users) => {
    callback(users);
  });

  return () => {
    socket.off('getOnlineUsers');
  };
};

// Setup socket listeners for reactions
export const setupReactionListeners = (messageUpdatedCallback) => {
  // Listen for reaction added events
  socket.on('messageReactionAdded', (updatedMessage) => {
    if (messageUpdatedCallback) {
      messageUpdatedCallback(updatedMessage);
    }
  });

  // Listen for reaction removed events
  socket.on('messageReactionRemoved', (updatedMessage) => {
    if (messageUpdatedCallback) {
      messageUpdatedCallback(updatedMessage);
    }
  });

  return () => {
    socket.off('messageReactionAdded');
    socket.off('messageReactionRemoved');
  };
};
