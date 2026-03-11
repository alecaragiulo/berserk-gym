'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/routines',  icon: '◈', label: 'Routines'  },
  { href: '/progress',  icon: '▲', label: 'Progress'  },
  { href: '/history',   icon: '◷', label: 'History'   },
]

interface Props {
  username: string
  streak: number
}

export default function Sidebar({ username, streak }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        className="hidden md:flex w-[72px] flex-col items-center py-6 gap-2 sticky top-0 h-screen flex-shrink-0"
        style={{ background: '#0e0d10', borderRight: '1px solid #4a4455' }}
      >
        <div className="mb-6">
          <svg viewBox="0 0 42 42" className="w-10 h-10">
            <polygon points="21,2 26,14 39,14 29,22 33,35 21,27 9,35 13,22 3,14 16,14"
              fill="none" stroke="#7a0000" strokeWidth="1.5"/>
            <circle cx="21" cy="21" r="3" fill="#c0392b"/>
          </svg>
        </div>

        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} title={item.label}
              className="w-11 h-11 flex items-center justify-center rounded-sm transition-all duration-200 text-lg"
              style={{
                background: active ? '#2e1a1a' : 'transparent',
                color: active ? '#e74c3c' : '#4a4455',
                boxShadow: active ? '0 0 16px rgba(192,57,43,0.25)' : 'none',
              }}>
              {item.icon}
            </Link>
          )
        })}

        <div className="mt-auto mb-2 flex flex-col items-center gap-1">
          <span className="text-crimson text-xs font-title">{streak}</span>
          <span className="text-ghost text-[9px] tracking-widest uppercase">streak</span>
        </div>

        <button onClick={handleLogout} title="Sign out"
          className="w-10 h-10 flex items-center justify-center font-title text-sm font-bold transition-all duration-200 rounded-sm"
          style={{ background: '#1a181e', border: '1px solid #7a0000', color: '#c0392b' }}>
          {username.charAt(0).toUpperCase()}
        </button>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: '#0e0d10',
          borderTop: '1px solid #4a4455',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-sm transition-all duration-200"
              style={{
                background: active ? '#2e1a1a' : 'transparent',
                color: active ? '#e74c3c' : '#4a4455',
              }}>
              <span className="text-xl">{item.icon}</span>
              <span className="font-title text-[9px] tracking-widest uppercase">{item.label}</span>
            </Link>
          )
        })}

        {/* Avatar/logout */}
        <button onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5"
          style={{ color: '#4a4455' }}>
          <span className="text-xl font-title font-bold" style={{ color: '#c0392b' }}>
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="font-title text-[9px] tracking-widest uppercase">Exit</span>
        </button>
      </nav>

      {/* Espaciado para que el contenido no quede tapado por el bottom nav */}
      <div className="md:hidden h-16" />
    </>
  )
}