const fastify = require('fastify');
const path = require('path');
const { env } = require('./config/env');
const authPlugin = require('./plugins/auth');

const buildApp = () => {
  const app = fastify({
    logger: env.nodeEnv !== 'test',
  });

  const corsOrigins =
    env.corsOrigin === '*'
      ? true
      : env.corsOrigin
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

  app.register(require('@fastify/cors'), {
    origin: corsOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });

  app.register(require('@fastify/multipart'), {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1024 * 1024,
      fileSize: 100 * 1024 * 1024,
      files: 1,
    },
  });

  app.register(require('@fastify/jwt'), {
    secret: env.jwtSecret,
  });

  app.register(authPlugin);

  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../storage/documents'),
    prefix: '/files/',
    decorateReply: false,
  });

  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  app.register(require('./routes/authRoutes'), { prefix: '/api/auth' });
  app.register(require('./routes/documentRoutes'), { prefix: '/api/documents' });
  app.register(require('./routes/annotationRoutes'), { prefix: '/api/annotations' });

  return app;
};

module.exports = {
  buildApp,
};
