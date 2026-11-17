import { execSync } from 'node:child_process'

/**
 * Brings the test database schema up to date before the run.
 * `migrate deploy` only applies pending migrations; each test file cleans its own data.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/stokla_test'
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  })
}
