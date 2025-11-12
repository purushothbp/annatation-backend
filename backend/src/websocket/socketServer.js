const { Server } = require('socket.io');
const { env } = require('../config/env');

const setupSocketServer = (fastify) => {
  if (fastify.io) {
    return fastify.io;
  }

  const origins = env.corsOrigin === '*' ? true : env.corsOrigin.split(',');

  const io = new Server(fastify.server, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
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

  fastify.decorate('io', io);

  fastify.addHook('onClose', async (instance, done) => {
    await instance.io.close();
    done();
  });

  return io;
};

module.exports = {
  setupSocketServer,
};
