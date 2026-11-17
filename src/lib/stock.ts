import type { MovementType, Prisma, PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from './db'

export class StockError extends Error {}

interface MovementInput {
  organizationId: string
  userId?: string
  productId: string
  type: MovementType
  /** IN / OUT: units moved. ADJUSTMENT: the counted stock level. */
  quantity: number
  note?: string
}

/**
 * Changes a product's stock and writes the movement log in one transaction.
 *
 * The stock update is a single conditional UPDATE ("add X where the result stays >= 0"),
 * so two people selling the last item at the same moment cannot push stock below zero:
 * the database applies one update after the other and the second one matches no rows.
 */
export async function recordMovement(input: MovementInput, db: PrismaClient = defaultPrisma) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: input.productId, organizationId: input.organizationId, archived: false },
      select: { id: true, quantity: true },
    })
    if (!product) throw new StockError('Product not found')

    let change: number
    if (input.type === 'IN') change = input.quantity
    else if (input.type === 'OUT') change = -input.quantity
    else change = input.quantity - product.quantity

    if (change === 0) throw new StockError('Stock is already at this level')

    const where: Prisma.ProductWhereInput = { id: product.id }
    if (input.type === 'ADJUSTMENT') {
      // Only apply the adjustment if nobody changed the stock since we read it
      where.quantity = product.quantity
    } else if (change < 0) {
      where.quantity = { gte: -change }
    }

    const { count } = await tx.product.updateMany({ where, data: { quantity: { increment: change } } })
    if (count === 0) {
      throw new StockError(
        input.type === 'ADJUSTMENT'
          ? 'Stock changed while you were editing. Please try again.'
          : 'Not enough stock for this movement'
      )
    }

    const { quantity: quantityAfter } = await tx.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { quantity: true },
    })

    return tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        productId: product.id,
        userId: input.userId,
        type: input.type,
        change,
        quantityAfter,
        note: input.note,
      },
    })
  })
}

export const isLowStock = (p: { quantity: number; minQuantity: number }) => p.quantity <= p.minQuantity

/** Numbers for the dashboard, all scoped to one organization. */
export async function getInventorySummary(organizationId: string, db: PrismaClient = defaultPrisma) {
  const [products, movementsThisWeek] = await Promise.all([
    db.product.findMany({
      where: { organizationId, archived: false },
      select: { id: true, name: true, sku: true, unit: true, quantity: true, minQuantity: true, costPrice: true, salePrice: true },
    }),
    db.stockMovement.count({
      where: { organizationId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ])

  const lowStock = products.filter(isLowStock).sort((a, b) => a.quantity - a.minQuantity - (b.quantity - b.minQuantity))

  return {
    productCount: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
    stockValue: products.reduce((sum, p) => sum + p.quantity * Number(p.costPrice), 0),
    potentialRevenue: products.reduce((sum, p) => sum + p.quantity * Number(p.salePrice), 0),
    lowStock,
    movementsThisWeek,
  }
}

/** "YYYY-MM-DD" of a date in the server's local timezone. */
export function localDateKey(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** Units received and shipped per day for the last `days` days (for the dashboard chart). */
export async function getDailyFlow(organizationId: string, days = 14, db: PrismaClient = defaultPrisma) {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const movements = await db.stockMovement.findMany({
    where: { organizationId, createdAt: { gte: since }, type: { in: ['IN', 'OUT'] } },
    select: { type: true, change: true, createdAt: true },
  })

  const byDay = new Map<string, { date: string; in: number; out: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = localDateKey(d)
    byDay.set(key, { date: key, in: 0, out: 0 })
  }

  for (const m of movements) {
    const entry = byDay.get(localDateKey(m.createdAt))
    if (!entry) continue
    if (m.type === 'IN') entry.in += m.change
    else entry.out += -m.change
  }

  return [...byDay.values()]
}
