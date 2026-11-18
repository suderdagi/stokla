import { requireUser } from '@/lib/session'
import { Sidebar } from './Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden md:flex-row">
      <Sidebar userName={user.name} organizationName={user.organization.name} />
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  )
}
