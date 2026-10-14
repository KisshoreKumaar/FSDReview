import { afterAll, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/config/db.js';

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

/** Drops every collection so suites cannot leak state into each other. */
export const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
};
