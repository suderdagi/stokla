import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { Card, CardTitle, PageHeader } from '@/components/Card'
import { SupplierForm } from './SupplierForm'

export const metadata = { title: 'Suppliers' }

export default async function SuppliersPage() {
  const user = await requireUser()
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: user.organizationId },
    include: { _count: { select: { products: { where: { archived: false } } } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <PageHeader title="Suppliers" description="Who you buy your products from" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <ul className="divide-y divide-stone-100">
            {suppliers.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-stone-500">{[s.email, s.phone].filter(Boolean).join(' · ') || 'No contact details'}</p>
                </div>
                <span className="text-stone-500">
                  {s._count.products} product{s._count.products === 1 ? '' : 's'}
                </span>
              </li>
            ))}
            {suppliers.length === 0 && <li className="px-5 py-12 text-center text-sm text-stone-500">No suppliers yet.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle title="Add supplier" />
          <div className="p-5">
            <SupplierForm />
          </div>
        </Card>
      </div>
    </div>
  )
}
