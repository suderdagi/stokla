import { createHash, randomBytes } from 'crypto'

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

/** If the sessions table leaked, the hashes alone could not be used to log in. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
