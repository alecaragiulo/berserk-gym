'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/workout',   icon: '⚔', label: 'Workout'   },
  { href: '/routines',  icon: '◈', label: 'Routines'  },
  { href: '/progress',  icon: '▲', label: 'Progress'  },
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
    <nav
      className="w-[72px] flex flex-col items-center py-6 gap-2 sticky top-0 h-screen"
      style={{ background: '#0e0d10', borderRight: '1px solid #4a4455' }}
    >
      {/* Brand */}
      <div className="mb-6">
        <svg viewBox="0 0 42 42" className="w-10 h-10">
          <polygon points="21,2 26,14 39,14 29,22 33,35 21,27 9,35 13,22 3,14 16,14"
            fill="none" stroke="#7a0000" strokeWidth="1.5"/>
          <circle cx="21" cy="21" r="3" fill="#c0392b"/>
        </svg>
      </div>

      {/* Nav */}
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="w-11 h-11 flex items-center justify-center rounded-sm transition-all duration-200 text-lg"
            style={{
              background: active ? '#2e1a1a' : 'transparent',
              color: active ? '#e74c3c' : '#4a4455',
              boxShadow: active ? '0 0 16px rgba(192,57,43,0.25)' : 'none',
            }}
          >
            {item.icon}
          </Link>
        )
      })}

      {/* Streak badge */}
      <div className="mt-auto mb-2 flex flex-col items-center gap-1">
        <span className="text-crimson text-xs font-title">{streak}</span>
        <span className="text-ghost text-[9px] tracking-widest uppercase">streak</span>
      </div>

      {/* Avatar / logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="w-10 h-10 flex items-center justify-center font-title text-sm font-bold transition-all duration-200 rounded-sm"
        style={{ background: '#1a181e', border: '1px solid #7a0000', color: '#c0392b' }}
      >
        {username.charAt(0).toUpperCase()}
      </button>
    </nav>
  )
}
