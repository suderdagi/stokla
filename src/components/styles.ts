import { clsx } from 'clsx'

export const buttonStyles = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60',
  secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
}

export function buttonClass(variant: keyof typeof buttonStyles = 'primary', className?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
    buttonStyles[variant],
    className
  )
}
