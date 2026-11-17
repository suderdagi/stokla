'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormMessage, SubmitButton, TextField } from '@/components/ui'
import { login } from '../actions'

export default function LoginPage() {
  const [state, action] = useActionState(login, null)

  return (
    <>
      <h1 className="mb-6 text-center text-lg font-semibold">Sign in to your account</h1>
      <form action={action} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <TextField label="Email" name="email" type="email" autoComplete="email" required errors={state?.fieldErrors?.email} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required errors={state?.fieldErrors?.password} />
        <FormMessage error={state?.error} />
        <SubmitButton className="w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        New to Stokla?{' '}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-stone-400">Demo: demo@stokla.dev / demo1234</p>
    </>
  )
}
