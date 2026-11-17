import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import { generateSessionToken, hashToken } from './tokens'

export const SESSION_COOKIE = 'stokla_session'
const SESSION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export async function createSession(userId: string) {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS)

  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript, so XSS can't steal it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

/**
 * The signed-in user, or null. Wrapped in React's cache() so several server components
 * in the same request share one database lookup.
 */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: {
        // Never load the password hash into the rest of the app
        select: { id: true, email: true, name: true, role: true, organizationId: true, organization: true },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session.user
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/** For pages and actions that need a user: redirects to the login page otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } })
  }
  cookieStore.delete(SESSION_COOKIE)
}
