import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { isLowStock } from '@/lib/stock'
import { formatMoney } from '@/lib/format'
import { UNIT_LABELS } from '@/lib/validation'
import { Badge, Card, PageHeader } from '@/components/Card'
import { buttonClass } from '@/components/styles'

export const metadata = { title: 'Products' }

type SearchParams = Promise<{ q?: string; filter?: string }>

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const { q = '', filter } = await searchParams

  const where: Prisma.ProductWhereInput = {
    organizationId: user.organizationId,
    archived: false,
    ...(q && {
      OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }],
    }),
  }

  const all = await prisma.product.findMany({
    where,
    include: { supplier: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
  // Low stock (quantity <= minQuantity) is filtered here, so the header count still covers every product matching the search
  const products = filter === 'low' ? all.filter(isLowStock) : all

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${all.length} active products`}
        actions={
          <Link href="/products/new" className={buttonClass('primary')}>
            <Plus size={16} /> New product
          </Link>
        }
      />

      <Card>
        {/* A plain GET form: filters end up in the URL and work without JavaScript */}
        <form className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or SKU"
              aria-label="Search products"
              className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-base md:text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            name="filter"
            defaultValue={filter ?? ''}
            aria-label="Stock filter"
            className="rounded-lg border border-stone-300 px-3 py-2 text-base md:text-sm"
          >
            <option value="">All products</option>
            <option value="low">Low stock only</option>
          </select>
          <button className={buttonClass('secondary')}>Apply</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">In stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-stone-500">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{formatMoney(p.costPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(p.salePrice)}</td>
                  <td className="px-4 py-3 text-right">
                    {p.quantity === 0 ? (
                      <Badge tone="red">Out of stock</Badge>
                    ) : isLowStock(p) ? (
                      <Badge tone="amber">
                        {p.quantity} {UNIT_LABELS[p.unit]}
                      </Badge>
                    ) : (
                      <span>
                        {p.quantity} {UNIT_LABELS[p.unit]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-stone-500">
              {q || filter ? 'No products match your filters.' : 'No products yet. Add your first one to get started.'}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
