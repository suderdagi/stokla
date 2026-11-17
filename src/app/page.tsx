import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowRight, BarChart3, Boxes, History, ShieldCheck } from 'lucide-react'
import { buttonClass } from '@/components/styles'

const FEATURES = [
  { icon: Boxes, title: 'Products and suppliers', text: 'Keep SKUs, prices, units and suppliers in one place.' },
  { icon: History, title: 'Full stock history', text: 'Every incoming, outgoing and counted change is logged with who did it.' },
  { icon: BarChart3, title: 'Low stock alerts', text: 'See what needs reordering before it runs out.' },
  { icon: ShieldCheck, title: 'Your data stays yours', text: 'Each business only ever sees its own inventory.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold tracking-tight">Stokla</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonClass('secondary')}>
            Sign in
          </Link>
          <Link href="/register" className={buttonClass('primary')}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Inventory tracking for small businesses</h1>
          <p className="mt-5 text-lg text-stone-600">
            Stokla replaces the stock spreadsheet: record what comes in and goes out, know what your stock is worth and never
            run out of your best sellers.
          </p>
          <Link href="/register" className={buttonClass('primary', 'mt-8 px-5 py-2.5 text-base')}>
            Create a free account <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-stone-200 bg-white p-6">
              <Icon className="text-brand-600" size={22} />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
