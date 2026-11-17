'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { createSession, destroySession } from '@/lib/session'
import { loginSchema, parseForm, registerSchema, toFormErrors, type FormState } from '@/lib/validation'

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(registerSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  const { organizationName, name, email, password } = parsed.data

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (exists) return { fieldErrors: { email: ['This email is already registered'] } }

  // The organization and its first user (the owner) are created together
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'OWNER',
      organization: { create: { name: organizationName } },
    },
  })

  await createSession(user.id)
  redirect('/dashboard')
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: 'Email or password is incorrect' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
