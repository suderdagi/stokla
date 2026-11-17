'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormMessage, SubmitButton, TextField } from '@/components/ui'
import { register } from '../actions'

export default function RegisterPage() {
  const [state, action] = useActionState(register, null)
  const errors = state?.fieldErrors

  return (
    <>
      <h1 className="mb-6 text-center text-lg font-semibold">Start tracking your stock</h1>
      <form action={action} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <TextField label="Business name" name="organizationName" placeholder="Ayşe's Shop" required errors={errors?.organizationName} />
        <TextField label="Your name" name="name" autoComplete="name" required errors={errors?.name} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required errors={errors?.email} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          errors={errors?.password}
          hint="At least 8 characters"
        />
        <FormMessage error={state?.error} />
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
