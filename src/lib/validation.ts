import { z } from 'zod'

export const UNITS = ['PIECE', 'KG', 'LITER', 'BOX'] as const
export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  PIECE: 'pcs',
  KG: 'kg',
  LITER: 'L',
  BOX: 'box',
}

const money = z.coerce
  .number({ message: 'Enter a number' })
  .min(0, 'Cannot be negative')
  .max(10_000_000)
  .transform((n) => Math.round(n * 100) / 100)

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => v || undefined)

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2, 'Business name is too short').max(80),
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Enter your password'),
})

export const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(100),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{2,30}$/, 'Use letters, numbers and dashes'),
    unit: z.enum(UNITS),
    costPrice: money,
    salePrice: money,
    minQuantity: z.coerce.number().int('Must be a whole number').min(0).max(1_000_000),
    supplierId: optionalText,
  })
  .refine((p) => p.salePrice >= p.costPrice, {
    message: 'Sale price is lower than the cost price',
    path: ['salePrice'],
  })

/**
 * For IN and OUT, `quantity` is how many units arrive or leave.
 * For ADJUSTMENT, it is the counted stock (e.g. after a stocktake), which can be 0.
 */
export const movementSchema = z
  .object({
    productId: z.string().min(1),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
    quantity: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative').max(1_000_000),
    note: optionalText,
  })
  .refine((m) => m.type === 'ADJUSTMENT' || m.quantity > 0, {
    message: 'Quantity must be at least 1',
    path: ['quantity'],
  })

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z
    .union([z.literal(''), z.email('Enter a valid email')])
    .optional()
    .transform((v) => v || undefined),
  phone: optionalText,
})

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: string
} | null

/** Turns FormData into a plain object and validates it. */
export function parseForm<T extends z.ZodType>(schema: T, formData: FormData) {
  return schema.safeParse(Object.fromEntries(formData))
}

export function toFormErrors(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]> }
}
