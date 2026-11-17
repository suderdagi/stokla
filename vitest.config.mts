import path from 'node:path'
import { defineConfig } from 'vitest/config'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/stokla_test'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // 'server-only' throws outside of Next.js; tests import server code directly
      'server-only': path.resolve(import.meta.dirname, 'tests/empty.ts'),
    },
  },
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    fileParallelism: false,
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
})
