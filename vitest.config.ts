import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for browser-like API support
    setupFiles: ['fake-indexeddb/auto'],
  },
});
