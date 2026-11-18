import { describe, expect, it } from 'vitest'
import { assertTestDatabase } from './safety'

describe('assertTestDatabase', () => {
  it('accepts databases whose name contains "test"', () => {
    expect(() => assertTestDatabase('postgresql://postgres@localhost:5432/stokla_test')).not.toThrow()
    expect(() => assertTestDatabase('postgresql://u:p@db.example.com:5432/ci-test?sslmode=require')).not.toThrow()
  })

  it('refuses every other database, so a wrong TEST_DATABASE_URL cannot wipe real data', () => {
    expect(() => assertTestDatabase('postgresql://postgres@localhost:5432/stokla')).toThrow(/Refusing/)
    expect(() => assertTestDatabase('postgresql://u:p@db.example.com:5432/contest')).toThrow(/Refusing/)
    expect(() => assertTestDatabase('postgresql://u:p@db.example.com:5432')).toThrow(/Refusing/)
  })
})
