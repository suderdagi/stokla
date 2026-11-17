/**
 * Demo data: one business with suppliers, products and 30 days of stock movements.
 * Run with `npm run db:seed`. Log in with demo@stokla.dev / demo1234.
 */
import bcrypt from 'bcryptjs'
import { PrismaClient, type MovementType, type Unit } from '@prisma/client'

const prisma = new PrismaClient()
const DAY = 24 * 60 * 60 * 1000

// Small deterministic random generator so every seed gives the same data
let state = 42
const random = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32)
const int = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min

const SUPPLIERS = [
  { name: 'Anadolu Tekstil', email: 'satis@anadolutekstil.example', phone: '0212 555 10 20' },
  { name: 'Ege Pamuk', email: 'info@egepamuk.example', phone: '0232 555 30 40' },
  { name: 'Kuzey Aksesuar', email: 'siparis@kuzeyaksesuar.example' },
]

const PRODUCTS: [name: string, sku: string, unit: Unit, cost: number, price: number, min: number, supplier: number][] = [
  ['Basic T-Shirt White M', 'TS-WHT-M', 'PIECE', 85, 199, 15, 0],
  ['Basic T-Shirt White L', 'TS-WHT-L', 'PIECE', 85, 199, 15, 0],
  ['Basic T-Shirt Black M', 'TS-BLK-M', 'PIECE', 85, 199, 15, 0],
  ['Linen Shirt Beige', 'SH-LIN-BEI', 'PIECE', 260, 549, 8, 1],
  ['Denim Jacket', 'JK-DNM-01', 'PIECE', 540, 1199, 5, 0],
  ['Cotton Socks (3 pack)', 'SK-COT-3P', 'BOX', 45, 119, 20, 1],
  ['Wool Scarf Grey', 'SC-WOL-GRY', 'PIECE', 150, 349, 6, 2],
  ['Leather Belt Brown', 'BL-LTH-BRN', 'PIECE', 180, 399, 6, 2],
  ['Canvas Tote Bag', 'BG-CNV-01', 'PIECE', 70, 179, 10, 2],
  ['Knit Beanie', 'HT-KNT-01', 'PIECE', 60, 149, 10, 2],
  ['Chino Trousers Navy 32', 'TR-CHN-NV32', 'PIECE', 310, 699, 5, 0],
  ['Hoodie Grey M', 'HD-GRY-M', 'PIECE', 280, 599, 8, 1],
  ['Gift Wrapping Paper', 'PK-GFT-ROLL', 'PIECE', 25, 0, 10, 2],
]

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'demo@stokla.dev' } })
  if (existing) {
    console.log('Demo data already exists')
    return
  }

  const user = await prisma.user.create({
    data: {
      name: 'Sude Erdağı',
      email: 'demo@stokla.dev',
      passwordHash: await bcrypt.hash('demo1234', 12),
      organization: { create: { name: 'Moda Butik' } },
    },
  })
  const organizationId = user.organizationId

  const suppliers = await Promise.all(
    SUPPLIERS.map((s) => prisma.supplier.create({ data: { ...s, organizationId } }))
  )

  const now = Date.now()
  for (const [name, sku, unit, cost, price, min, supplierIndex] of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        organizationId,
        name,
        sku,
        unit,
        costPrice: cost,
        salePrice: price || cost, // sale price may not be lower than cost
        minQuantity: min,
        supplierId: suppliers[supplierIndex].id,
      },
    })

    // Opening stock 30 days ago, then daily sales and a few deliveries
    let quantity = 0
    const movements: { type: MovementType; change: number; quantityAfter: number; note?: string; createdAt: Date }[] = []
    const add = (type: MovementType, change: number, daysAgo: number, note?: string) => {
      if (quantity + change < 0) return
      quantity += change
      movements.push({ type, change, quantityAfter: quantity, note, createdAt: new Date(now - daysAgo * DAY - int(1, 10) * 3_600_000) })
    }

    add('IN', int(min * 2, min * 5), 30, 'Opening stock')
    for (let day = 29; day >= 0; day--) {
      if (random() < 0.55) add('OUT', -int(1, Math.max(2, Math.round(min / 3))), day, `Order #${int(1000, 9999)}`)
      if (quantity <= min && random() < 0.4) add('IN', int(min * 2, min * 4), day, `Invoice ${int(100, 999)}`)
      if (day === 10 && random() < 0.3) add('ADJUSTMENT', -int(1, 2), day, 'Monthly stock count')
    }

    await prisma.stockMovement.createMany({
      data: movements.map((m) => ({ ...m, organizationId, productId: product.id, userId: user.id })),
    })
    await prisma.product.update({ where: { id: product.id }, data: { quantity } })
  }

  console.log('Seeded demo business. Log in with demo@stokla.dev / demo1234')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
