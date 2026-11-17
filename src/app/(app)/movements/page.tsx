import Link from 'next/link'
import type { MovementType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { formatDateTime } from '@/lib/format'
import { Card, PageHeader } from '@/components/Card'
import { MovementBadge } from '@/components/MovementBadge'
import { buttonClass } from '@/components/styles'

export const metadata = { title: 'Stock movements' }

const PAGE_SIZE = 25
const TYPES: MovementType[] = ['IN', 'OUT', 'ADJUSTMENT']

type SearchParams = Promise<{ type?: string; page?: string }>

export default async function MovementsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser()
  const params = await searchParams
  const type = TYPES.find((t) => t === params.type)
  const page = Math.max(1, Number(params.page) || 1)

  const where = { organizationId: user.organizationId, ...(type && { type }) }
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { id: true, name: true, sku: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.stockMovement.count({ where }),
  ])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const href = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams()
    const merged = { type, page, ...changes }
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'page' && v === 1)) next.set(k, String(v))
    return `/movements${next.size ? `?${next}` : ''}`
  }

  return (
    <div>
      <PageHeader title="Stock movements" description="Every change to your stock, newest first" />

      <div className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...TYPES].map((t) => (
          <Link
            key={t ?? 'all'}
            href={href({ type: t, page: 1 })}
            className={buttonClass(t === type ? 'primary' : 'secondary', 'py-1.5')}
          >
            {t === undefined ? 'All' : t === 'IN' ? 'Received' : t === 'OUT' ? 'Shipped' : 'Counts'}
          </Link>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Change</th>
                <th className="px-4 py-3 text-right font-medium">Stock after</th>
                <th className="px-4 py-3 font-medium">By</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDateTime(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/products/${m.product.id}`} className="font-medium hover:underline">
                      {m.product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <MovementBadge type={m.type} />
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${m.change > 0 ? 'text-brand-700' : 'text-amber-700'}`}>
                    {m.change > 0 ? '+' : ''}
                    {m.change}
                  </td>
                  <td className="px-4 py-3 text-right">{m.quantityAfter}</td>
                  <td className="px-4 py-3 text-stone-600">{m.user?.name ?? '—'}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-stone-500">{m.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <p className="px-4 py-12 text-center text-sm text-stone-500">No movements found.</p>}
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-sm text-stone-500">
          <span>{total} movements</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className={buttonClass('secondary', 'py-1')}>
                Previous
              </Link>
            )}
            <span>
              Page {page} / {pages}
            </span>
            {page < pages && (
              <Link href={href({ page: page + 1 })} className={buttonClass('secondary', 'py-1')}>
                Next
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
