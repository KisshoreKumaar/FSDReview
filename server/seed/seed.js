/**
 * Seeds staff, courses and ~40 applications spread across every status.
 * Safe to re-run: existing users/courses are updated, applications are skipped.
 *
 *   npm run seed            # add to whatever is there
 *   npm run seed -- --fresh # wipe applications/documents/payments first
 */
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';
import { seedStaff } from './users.js';
import { seedCourses } from './courses.js';
import { seedApplications } from './applications.js';

const wipe = async () => {
  const names = ['applications', 'documents', 'payments', 'meritlists', 'notifications', 'counters'];
  await Promise.all(names.map((n) => mongoose.connection.collection(n).deleteMany({}).catch(() => {})));
  logger.warn('Cleared applications, documents, payments, merit lists and notifications');
};

const run = async () => {
  await connectDb();
  if (process.argv.includes('--fresh')) await wipe();

  const { admin, officers } = await seedStaff();
  logger.info(`Staff ready: ${admin.email} (admin), ${officers.map((o) => o.email).join(', ')}`);

  const courses = await seedCourses();
  logger.info(`Courses ready: ${courses.length}`);

  const { applications, password } = await seedApplications({ courses, officers });
  logger.info(`Applications created: ${applications.length} (applicant password: ${password})`);

  await disconnectDb();
};

run().catch(async (err) => {
  logger.error('Seed failed', err);
  await disconnectDb();
  process.exit(1);
});
