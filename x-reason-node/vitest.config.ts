import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/test/**/*.test.ts', '**/test/**/*.test.js'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    globals: true, // Enables global test functions like describe, it, expect
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@xreason': resolve(__dirname, './src'),
      '@osdk/shared.client': resolve(__dirname, './node_modules/@osdk/shared.client/index.js'),
      '@osdk/shared.client2': resolve(__dirname, './node_modules/@osdk/shared.client2/index.js'),
    },
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    target: 'node18'
  }
})
