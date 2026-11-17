'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { FormMessage, SubmitButton, TextField } from '@/components/ui'
import { addMovement } from '../actions'

const TYPES = [
  { value: 'IN', label: 'Receive', help: 'Goods arrived from a supplier' },
  { value: 'OUT', label: 'Ship', help: 'Sold or used' },
  { value: 'ADJUSTMENT', label: 'Count', help: 'Set stock to what you counted' },
] as const

export function MovementForm({ productId, current, unit }: { productId: string; current: number; unit: string }) {
  const [state, action] = useActionState(addMovement, null)
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('IN')
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the inputs after a successful change
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-stone-100 p-1" role="radiogroup" aria-label="Movement type">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={clsx('rounded-md py-1.5 text-sm font-medium', type === t.value ? 'bg-white shadow-sm' : 'text-stone-600')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-stone-500">{TYPES.find((t) => t.value === type)?.help}</p>

      <TextField
        label={type === 'ADJUSTMENT' ? `Counted quantity (${unit})` : `Quantity (${unit})`}
        name="quantity"
        type="number"
        min={type === 'ADJUSTMENT' ? 0 : 1}
        max={type === 'OUT' ? current : undefined}
        required
        errors={state?.fieldErrors?.quantity}
      />
      <TextField label="Note" name="note" placeholder="Invoice no, order no…" errors={state?.fieldErrors?.note} />
      <FormMessage error={state?.error} success={state?.success} />
      <SubmitButton className="w-full" pendingText="Updating…">
        Update stock
      </SubmitButton>
    </form>
  )
}
