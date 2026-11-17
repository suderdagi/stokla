'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ArrowLeftRight, LayoutDashboard, LogOut, Package, Truck } from 'lucide-react'
import { logout } from '../(auth)/actions'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/movements', label: 'Stock movements', icon: ArrowLeftRight },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
]

export function Sidebar({ userName, organizationName }: { userName: string; organizationName: string }) {
  const pathname = usePathname()

  return (
    <aside className="border-b border-stone-200 bg-white md:flex md:min-h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-5 py-4">
        <Logo />
        <div className="min-w-0">
          <p className="font-bold leading-tight tracking-tight">Stokla</p>
          <p className="truncate text-xs text-stone-500">{organizationName}</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                active ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="hidden items-center justify-between border-t border-stone-100 px-5 py-4 md:flex">
        <span className="truncate text-sm font-medium">{userName}</span>
        <form action={logout}>
          <button className="rounded p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  )
}
