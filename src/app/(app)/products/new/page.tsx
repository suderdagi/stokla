import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { Card, PageHeader } from '@/components/Card'
import { ProductForm } from '../ProductForm'
import { createProduct } from '../actions'

export const metadata = { title: 'New product' }

export default async function NewProductPage() {
  const user = await requireUser()
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-2xl">
      <Link href="/products" className="text-sm text-stone-500 hover:underline">
        ← Products
      </Link>
      <PageHeader title="New product" />
      <Card className="p-6">
        <ProductForm action={createProduct} suppliers={suppliers} />
      </Card>
    </div>
  )
}
