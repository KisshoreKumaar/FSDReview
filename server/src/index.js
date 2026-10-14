import http from 'node:http';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initSockets } from './sockets/index.js';

const start = async () => {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down`);
    server.close(() => process.exit(0));
  };
  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
