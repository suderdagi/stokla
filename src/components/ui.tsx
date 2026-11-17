'use client'

import { buttonClass, type buttonStyles } from './styles'
import { useFormStatus } from 'react-dom'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

/** Submit button that disables itself while its form's server action is running. */
export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string; variant?: keyof typeof buttonStyles }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, className)} {...props}>
      {pending ? (pendingText ?? 'Saving…') : children}
    </button>
  )
}

const controlClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 aria-[invalid=true]:border-red-400'

interface FieldProps {
  label: string
  name: string
  errors?: string[]
  hint?: string
}

export function TextField({ label, name, errors, hint, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} name={name} errors={errors} hint={hint}>
      <input
        id={name}
        name={name}
        aria-invalid={!!errors?.length}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={controlClass}
        {...props}
      />
    </FieldWrapper>
  )
}

export function SelectField({
  label,
  name,
  errors,
  hint,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <FieldWrapper label={label} name={name} errors={errors} hint={hint}>
      <select id={name} name={name} aria-invalid={!!errors?.length} className={controlClass} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
}

function FieldWrapper({ label, name, errors, hint, children }: FieldProps & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {errors?.length ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {errors[0]}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    )
  }
  if (success) {
    return (
      <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
        {success}
      </p>
    )
  }
  return null
}
