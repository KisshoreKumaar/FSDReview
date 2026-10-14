/**
 * Standalone MongoDB for local development — no Docker, no Atlas account.
 * Reuses the mongodb-memory-server binary but pins a port and a data directory,
 * so the API, the seed script and tests all share one persistent database.
 *
 *   node scripts/dev-mongo.js      # keeps running until Ctrl-C
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(here, '../.mongo-data');
const port = Number(process.env.DEV_MONGO_PORT || 27017);

fs.mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: { port, dbPath, storageEngine: 'wiredTiger' },
});

process.stdout.write(`Dev MongoDB ready at ${mongod.getUri()} (data: ${dbPath})\n`);

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, stop));
