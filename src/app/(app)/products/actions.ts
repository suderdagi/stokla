'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { recordMovement, StockError } from '@/lib/stock'
import { movementSchema, parseForm, productSchema, toFormErrors, type FormState } from '@/lib/validation'

async function assertSupplier(organizationId: string, supplierId?: string) {
  if (!supplierId) return true
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, organizationId }, select: { id: true } })
  return supplier !== null
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = parseForm(productSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  if (!(await assertSupplier(user.organizationId, parsed.data.supplierId))) {
    return { fieldErrors: { supplierId: ['Unknown supplier'] } }
  }

  let productId: string
  try {
    const product = await prisma.product.create({
      data: { ...parsed.data, organizationId: user.organizationId },
    })
    productId = product.id
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { sku: ['Another product already uses this SKU'] } }
    throw error
  }

  // Opening stock is recorded as a normal movement, so the history adds up from day one
  const opening = Number(formData.get('openingStock') ?? 0)
  if (Number.isInteger(opening) && opening > 0) {
    await recordMovement({
      organizationId: user.organizationId,
      userId: user.id,
      productId,
      type: 'IN',
      quantity: opening,
      note: 'Opening stock',
    })
  }

  revalidatePath('/products')
  redirect(`/products/${productId}`)
}

export async function updateProduct(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = parseForm(productSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  if (!(await assertSupplier(user.organizationId, parsed.data.supplierId))) {
    return { fieldErrors: { supplierId: ['Unknown supplier'] } }
  }

  try {
    // updateMany with organizationId: a user can never touch another organization's product
    const { count } = await prisma.product.updateMany({
      where: { id: productId, organizationId: user.organizationId },
      data: { ...parsed.data, supplierId: parsed.data.supplierId ?? null },
    })
    if (count === 0) return { error: 'Product not found' }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { sku: ['Another product already uses this SKU'] } }
    throw error
  }

  revalidatePath(`/products/${productId}`)
  revalidatePath('/products')
  return { success: 'Product saved' }
}

export async function archiveProduct(productId: string) {
  const user = await requireUser()
  await prisma.product.updateMany({
    where: { id: productId, organizationId: user.organizationId },
    data: { archived: true },
  })
  revalidatePath('/products')
  redirect('/products')
}

export async function addMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = parseForm(movementSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  try {
    await recordMovement({ ...parsed.data, organizationId: user.organizationId, userId: user.id })
  } catch (error) {
    if (error instanceof StockError) return { error: error.message }
    throw error
  }

  revalidatePath(`/products/${parsed.data.productId}`)
  revalidatePath('/dashboard')
  return { success: 'Stock updated' }
}
