const { Server } = require('socket.io');
const { env } = require('../config/env');

const parseOrigins = () =>
  env.corsOrigin === '*'
    ? true
    : env.corsOrigin
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: parseOrigins(),
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: false,
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinDocument', (documentId) => {
      if (!documentId) return;
      socket.join(`doc:${documentId}`);
      socket.emit('joinedDocument', { documentId });
    });

    socket.on('leaveDocument', (documentId) => {
      if (!documentId) return;
      socket.leave(`doc:${documentId}`);
    });

    socket.on('user.cursor', (payload) => {
      if (!payload?.documentId) return;
      socket.to(`doc:${payload.documentId}`).emit('user.cursor', {
        userId: payload.userId,
        selection: payload.selection,
      });
    });
  });

  return io;
};

module.exports = {
  initSocket,
};
