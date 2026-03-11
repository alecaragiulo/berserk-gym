'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/routines',  icon: '◈', label: 'Routines'  },
  { href: '/history',   icon: '◷', label: 'History'   },
  { href: '/progress',  icon: '▲', label: 'Progress'  },
]

interface Props {
  username: string
  streak: number
}

export default function Sidebar({ username, streak }: Props) {
  const pathname = usePathname()
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current

      if (diff > 8) setNavVisible(false)       // scrolleando hacia abajo
      else if (diff < -8) setNavVisible(true)  // scrolleando hacia arriba

      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen sticky top-0"
        style={{ background: '#0e0d10', borderRight: '1px solid #1a181e' }}>
        <div className="p-6 pb-4" style={{ borderBottom: '1px solid #1a181e' }}>
          <p className="font-title text-blood text-[10px] tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
          <p className="font-title text-bone text-sm font-bold tracking-wide truncate">{username}</p>
          {streak > 0 && (
            <p className="font-title text-[10px] tracking-widest text-ghost mt-1">
              🔥 {streak} day streak
            </p>
          )}
        </div>
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 transition-all duration-150 font-title text-xs tracking-widest uppercase"
                style={{
                  background: active ? '#1a181e' : 'transparent',
                  color: active ? '#f0e8d5' : '#6e6880',
                  borderLeft: active ? '2px solid #c0392b' : '2px solid transparent',
                }}>
                <span style={{ color: active ? '#c0392b' : '#6e6880' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300"
        style={{
          background: '#0e0d10',
          borderTop: '1px solid #1a181e',
          transform: navVisible ? 'translateY(0)' : 'translateY(100%)',
        }}>
        <div className="flex items-center justify-around px-2 py-1.5 pb-safe">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all duration-150"
                style={{ color: active ? '#e74c3c' : '#4a4455' }}>
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="font-title text-[8px] tracking-widest uppercase">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}