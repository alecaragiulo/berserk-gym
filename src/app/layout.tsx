import type { Metadata } from 'next'
import './globals.css'
import { Cinzel, Rajdhani } from 'next/font/google'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Iron Berserk — Forge Your Will',
  description: 'Gym tracker. No mercy.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${rajdhani.variable}`}>
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
