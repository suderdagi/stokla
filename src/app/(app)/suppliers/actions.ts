'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { parseForm, supplierSchema, toFormErrors, type FormState } from '@/lib/validation'

export async function createSupplier(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = parseForm(supplierSchema, formData)
  if (!parsed.success) return toFormErrors(parsed.error)

  try {
    await prisma.supplier.create({ data: { ...parsed.data, organizationId: user.organizationId } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { fieldErrors: { name: ['A supplier with this name already exists'] } }
    }
    throw error
  }

  revalidatePath('/suppliers')
  return { success: `${parsed.data.name} added` }
}
