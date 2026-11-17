import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import { getDailyFlow, getInventorySummary, recordMovement, StockError } from '@/lib/stock'

let orgId: string
let otherOrgId: string
let productId: string

async function createProduct(organizationId: string, overrides: Partial<{ sku: string; minQuantity: number }> = {}) {
  return prisma.product.create({
    data: { organizationId, name: 'T-Shirt', sku: overrides.sku ?? 'TS-01', costPrice: 50, salePrice: 120, minQuantity: overrides.minQuantity ?? 5 },
  })
}

beforeEach(async () => {
  await prisma.organization.deleteMany()
  const [org, other] = await Promise.all([
    prisma.organization.create({ data: { name: 'Shop A' } }),
    prisma.organization.create({ data: { name: 'Shop B' } }),
  ])
  orgId = org.id
  otherOrgId = other.id
  productId = (await createProduct(orgId)).id
})

afterAll(() => prisma.$disconnect())

const move = (type: 'IN' | 'OUT' | 'ADJUSTMENT', quantity: number, organizationId = orgId) =>
  recordMovement({ organizationId, productId, type, quantity })

const stock = async () => (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).quantity

describe('recordMovement', () => {
  it('adds and removes stock and logs each change', async () => {
    await move('IN', 20)
    const out = await move('OUT', 8)

    expect(await stock()).toBe(12)
    expect(out).toMatchObject({ type: 'OUT', change: -8, quantityAfter: 12 })
  })

  it('never lets stock go below zero', async () => {
    await move('IN', 3)
    await expect(move('OUT', 4)).rejects.toThrow('Not enough stock')
    expect(await stock()).toBe(3)
    expect(await prisma.stockMovement.count()).toBe(1)
  })

  it('handles many simultaneous sales of the last items correctly', async () => {
    await move('IN', 5)

    // 10 requests try to sell 1 unit each at the same time; only 5 units exist
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => move('OUT', 1)))

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(5)
    expect(await stock()).toBe(0)
  })

  it('sets the counted quantity on adjustment and records the difference', async () => {
    await move('IN', 10)
    const adjustment = await move('ADJUSTMENT', 7)

    expect(adjustment).toMatchObject({ change: -3, quantityAfter: 7 })
    expect(await stock()).toBe(7)
    await expect(move('ADJUSTMENT', 7)).rejects.toBeInstanceOf(StockError)
  })

  it('keeps the product quantity equal to the sum of its movements', async () => {
    for (const [type, quantity] of [['IN', 50], ['OUT', 12], ['OUT', 3], ['ADJUSTMENT', 30], ['IN', 4]] as const) {
      await move(type, quantity)
    }
    const { _sum } = await prisma.stockMovement.aggregate({ where: { productId }, _sum: { change: true } })
    expect(_sum.change).toBe(await stock())
  })

  it('cannot change a product of another organization', async () => {
    await expect(move('IN', 5, otherOrgId)).rejects.toThrow('Product not found')
    expect(await stock()).toBe(0)
  })
})

describe('getInventorySummary', () => {
  it('calculates stock value and lists low stock products of one organization only', async () => {
    await move('IN', 4) // 4 <= minimum 5 → low stock
    const second = await createProduct(orgId, { sku: 'TS-02', minQuantity: 1 })
    await recordMovement({ organizationId: orgId, productId: second.id, type: 'IN', quantity: 10 })
    await createProduct(otherOrgId, { sku: 'OTHER' })

    const summary = await getInventorySummary(orgId)

    expect(summary.productCount).toBe(2)
    expect(summary.totalUnits).toBe(14)
    expect(summary.stockValue).toBe(14 * 50)
    expect(summary.lowStock.map((p) => p.id)).toEqual([productId])
  })
})

describe('getDailyFlow', () => {
  it('returns one entry per day with received and shipped units', async () => {
    await move('IN', 10)
    await move('OUT', 4)

    const flow = await getDailyFlow(orgId, 7)
    expect(flow).toHaveLength(7)
    expect(flow.at(-1)).toMatchObject({ in: 10, out: 4 })
  })
})
