'use client'

import { useActionState } from 'react'
import { FormMessage, SelectField, SubmitButton, TextField } from '@/components/ui'
import { UNIT_LABELS, UNITS, type FormState } from '@/lib/validation'

interface ProductFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  suppliers: { id: string; name: string }[]
  defaults?: {
    name: string
    sku: string
    unit: string
    costPrice: string
    salePrice: string
    minQuantity: number
    supplierId: string | null
  }
}

export function ProductForm({ action, suppliers, defaults }: ProductFormProps) {
  const [state, formAction] = useActionState(action, null)
  const errors = state?.fieldErrors
  const isNew = !defaults

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField label="Name" name="name" defaultValue={defaults?.name} required errors={errors?.name} />
      </div>
      <TextField label="SKU" name="sku" defaultValue={defaults?.sku} placeholder="TSHIRT-M-BLK" required errors={errors?.sku} />
      <SelectField label="Unit" name="unit" defaultValue={defaults?.unit ?? 'PIECE'} errors={errors?.unit}>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {UNIT_LABELS[u]}
          </option>
        ))}
      </SelectField>
      <TextField label="Cost price (₺)" name="costPrice" type="number" step="0.01" min="0" defaultValue={defaults?.costPrice} required errors={errors?.costPrice} />
      <TextField label="Sale price (₺)" name="salePrice" type="number" step="0.01" min="0" defaultValue={defaults?.salePrice} required errors={errors?.salePrice} />
      <TextField
        label="Minimum stock"
        name="minQuantity"
        type="number"
        min="0"
        defaultValue={defaults?.minQuantity ?? 5}
        errors={errors?.minQuantity}
        hint="Shown as low stock at or below this amount"
      />
      <SelectField label="Supplier" name="supplierId" defaultValue={defaults?.supplierId ?? ''} errors={errors?.supplierId}>
        <option value="">No supplier</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>
      {isNew && (
        <TextField label="Opening stock" name="openingStock" type="number" min="0" defaultValue={0} hint="Units you have right now" />
      )}
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{isNew ? 'Create product' : 'Save changes'}</SubmitButton>
        <FormMessage error={state?.error} success={state?.success} />
      </div>
    </form>
  )
}
