import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { isLowStock } from '@/lib/stock'
import { formatDateTime, formatMoney } from '@/lib/format'
import { UNIT_LABELS } from '@/lib/validation'
import { Badge, Card, CardTitle, PageHeader } from '@/components/Card'
import { MovementBadge } from '@/components/MovementBadge'
import { buttonClass } from '@/components/styles'
import { ProductForm } from '../ProductForm'
import { archiveProduct, updateProduct } from '../actions'
import { MovementForm } from './MovementForm'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()

  // findFirst with organizationId: guessing another organization's product id shows a 404
  const product = await prisma.product.findFirst({
    where: { id, organizationId: user.organizationId, archived: false },
    include: {
      movements: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 50 },
    },
  })
  if (!product) notFound()

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const unit = UNIT_LABELS[product.unit]
  const margin = Number(product.salePrice) - Number(product.costPrice)

  return (
    <div>
      <Link href="/products" className="text-sm text-stone-500 hover:underline">
        ← Products
      </Link>
      <PageHeader
        title={product.name}
        description={product.sku}
        actions={
          <form action={archiveProduct.bind(null, product.id)}>
            <button className={buttonClass('danger')}>Archive</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-stone-500">In stock</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            {product.quantity} {unit}
            {product.quantity === 0 ? <Badge tone="red">Out of stock</Badge> : isLowStock(product) && <Badge tone="amber">Low</Badge>}
          </p>
          <p className="mt-1 text-xs text-stone-500">Minimum {product.minQuantity}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-stone-500">Stock value</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(product.quantity * Number(product.costPrice))}</p>
          <p className="mt-1 text-xs text-stone-500">at cost price</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-stone-500">Margin per {unit}</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(margin)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {Number(product.salePrice) > 0 ? `${Math.round((margin / Number(product.salePrice)) * 100)}% of sale price` : '—'}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle title="Change stock" />
          <div className="p-5">
            <MovementForm productId={product.id} current={product.quantity} unit={unit} />
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle title="History" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Change</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stock after</th>
                  <th className="px-4 py-2.5 font-medium">By</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {product.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-stone-600">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <MovementBadge type={m.type} />
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${m.change > 0 ? 'text-brand-700' : 'text-amber-700'}`}>
                      {m.change > 0 ? '+' : ''}
                      {m.change}
                    </td>
                    <td className="px-4 py-2.5 text-right">{m.quantityAfter}</td>
                    <td className="px-4 py-2.5 text-stone-600">{m.user?.name ?? '—'}</td>
                    <td className="max-w-48 truncate px-4 py-2.5 text-stone-500">{m.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {product.movements.length === 0 && <p className="px-4 py-10 text-center text-sm text-stone-500">No movements yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle title="Product details" />
        <div className="p-6">
          <ProductForm
            action={updateProduct.bind(null, product.id)}
            suppliers={suppliers}
            defaults={{
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              costPrice: product.costPrice.toString(),
              salePrice: product.salePrice.toString(),
              minQuantity: product.minQuantity,
              supplierId: product.supplierId,
            }}
          />
        </div>
      </Card>
    </div>
  )
}
