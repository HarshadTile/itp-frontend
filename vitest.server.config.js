import { defineConfig } from 'vitest/config';

// Server-side tests run in Node and talk to the local MySQL instance.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
