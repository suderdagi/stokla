'use client'

import { useActionState, useEffect, useRef } from 'react'
import { FormMessage, SubmitButton, TextField } from '@/components/ui'
import { createSupplier } from './actions'

export function SupplierForm() {
  const [state, action] = useActionState(createSupplier, null)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) ref.current?.reset()
  }, [state])

  return (
    <form ref={ref} action={action} className="space-y-4">
      <TextField label="Company name" name="name" required errors={state?.fieldErrors?.name} />
      <TextField label="Email" name="email" type="email" errors={state?.fieldErrors?.email} />
      <TextField label="Phone" name="phone" type="tel" errors={state?.fieldErrors?.phone} />
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton className="w-full">Add supplier</SubmitButton>
    </form>
  )
}
