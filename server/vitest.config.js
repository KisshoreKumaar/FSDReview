import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // One process, one in-memory MongoDB — suites share the connection.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    env: {
      NODE_ENV: 'test',
      // Empty => config/db.js boots an isolated in-process MongoDB for tests.
      MONGO_URI: '',
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      BCRYPT_ROUNDS: '4',
    },
  },
});
