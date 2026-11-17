import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { getDailyFlow, getInventorySummary } from '@/lib/stock'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { UNIT_LABELS } from '@/lib/validation'
import { Badge, Card, CardTitle, PageHeader } from '@/components/Card'
import { MovementBadge } from '@/components/MovementBadge'
import { FlowChart } from './FlowChart'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireUser()
  const [summary, flow, recent] = await Promise.all([
    getInventorySummary(user.organizationId),
    getDailyFlow(user.organizationId, 14),
    prisma.stockMovement.findMany({
      where: { organizationId: user.organizationId },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const stats = [
    { label: 'Products', value: formatNumber(summary.productCount) },
    { label: 'Units in stock', value: formatNumber(summary.totalUnits) },
    { label: 'Stock value (cost)', value: formatMoney(summary.stockValue) },
    { label: 'Movements this week', value: formatNumber(summary.movementsThisWeek) },
  ]

  return (
    <div>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} description="Here is where your inventory stands today" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-stone-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardTitle title="Received vs shipped (last 14 days)" />
          <div className="h-72 p-4">
            <FlowChart data={flow} />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle
            title="Low stock"
            action={summary.lowStock.length > 0 && <Badge tone="red">{summary.lowStock.length} to reorder</Badge>}
          />
          {summary.lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">Everything is above its minimum level.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {summary.lowStock.slice(0, 7).map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-stone-50">
                    <span className="flex min-w-0 items-center gap-2">
                      <AlertTriangle size={15} className={p.quantity === 0 ? 'shrink-0 text-red-500' : 'shrink-0 text-amber-500'} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="shrink-0 text-stone-500">
                      <strong className={p.quantity === 0 ? 'text-red-600' : 'text-stone-900'}>{p.quantity}</strong> / min {p.minQuantity}{' '}
                      {UNIT_LABELS[p.unit]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle title="Recent activity" action={<Link href="/movements" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>} />
        <ul className="divide-y divide-stone-100">
          {recent.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <MovementBadge type={m.type} />
                <Link href={`/products/${m.product.id}`} className="truncate font-medium hover:underline">
                  {m.product.name}
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-stone-500">
                <span className={m.change > 0 ? 'text-brand-700' : 'text-amber-700'}>
                  {m.change > 0 ? '+' : ''}
                  {m.change}
                </span>
                <span className="hidden sm:inline">{formatDateTime(m.createdAt)}</span>
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="px-5 py-10 text-center text-sm text-stone-500">No stock movements yet.</li>}
        </ul>
      </Card>
    </div>
  )
}
