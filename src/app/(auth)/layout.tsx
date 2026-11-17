import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect('/dashboard')

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">Stokla</span>
        </Link>
        {children}
      </div>
    </div>
  )
}
