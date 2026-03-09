'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        if (!username.trim()) throw new Error('El username es requerido')
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: username } },
        })
        if (error) throw error
        setMessage('Revisá tu email para confirmar la cuenta.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 600px 400px at 50% 50%, rgba(122,0,0,0.08) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm px-6 relative z-10">
        <div className="text-center mb-10">
          <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto mb-4">
            <polygon points="28,3 34,18 50,18 38,29 43,45 28,35 13,45 18,29 6,18 22,18"
              fill="none" stroke="#7a0000" strokeWidth="1.5"/>
            <polygon points="28,10 32,20 43,20 35,27 38,38 28,32 18,38 21,27 13,20 24,20"
              fill="#7a0000" opacity="0.25"/>
            <circle cx="28" cy="28" r="4" fill="#c0392b"/>
          </svg>
          <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
          <h1 className="font-title text-2xl font-bold text-bone tracking-wide">Forge Your Will</h1>
        </div>

        <div className="flex mb-6 border border-ghost/30">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setMessage(null) }}
              className="flex-1 py-2.5 font-title text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                background: mode === m ? '#7a0000' : 'transparent',
                color: mode === m ? '#d4c9b0' : '#4a4455',
              }}>
              {m === 'login' ? 'Enter' : 'Join'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === 'register' && (
            <input className="input-dark w-full px-4 py-3 text-sm tracking-wide"
              placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value)} />
          )}
          <input className="input-dark w-full px-4 py-3 text-sm tracking-wide"
            placeholder="Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} />
          <input className="input-dark w-full px-4 py-3 text-sm tracking-wide"
            placeholder="Password" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && (
          <p className="mt-4 text-ember text-xs tracking-wide border border-blood/50 bg-rust/30 px-4 py-2">{error}</p>
        )}
        {message && (
          <p className="mt-4 text-gold text-xs tracking-wide border border-gold/30 bg-iron/50 px-4 py-2">{message}</p>
        )}

        <button className="btn-primary mt-5" onClick={handleSubmit}
          disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Loading...' : mode === 'login' ? 'Enter the Abyss' : 'Forge Your Mark'}
        </button>
      </div>
    </div>
  )
}