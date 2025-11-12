const { buildApp } = require('./app');
const { connectDB } = require('./config/db');
const { env } = require('./config/env');
const { setupSocketServer } = require('./websocket/socketServer');

const start = async () => {
  try {
    await connectDB();
    const app = buildApp();
    setupSocketServer(app);

    await app.listen({ port: env.port, host: '0.0.0.0' });

    app.log.info(`Server listening on port ${env.port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
