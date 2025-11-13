const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { env } = require('./config/env');
const { initSocket } = require('./websocket/socketServer');

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = initSocket(server);
    app.set('io', io);

    server.listen(env.port, '0.0.0.0', () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
