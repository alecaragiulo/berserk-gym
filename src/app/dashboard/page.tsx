import { getDashboardStats } from '@/lib/queries/sessions'
import { getMyRoutines } from '@/lib/queries/routines'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch en paralelo — Server Components hacen esto muy limpio
  const [stats, routines] = await Promise.all([
    getDashboardStats(),
    getMyRoutines(),
  ])

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <header className="mb-8 border-b border-ghost/30 pb-6 relative">
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }}
        />
        <p className="font-title text-blood text-xs tracking-widest uppercase mb-1">
          Iron Berserk · Forge Your Will
        </p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          War <span className="text-crimson">Dashboard</span>
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 mb-8">
      {[
          { label: 'Sessions',  value: stats?.totalSessions ?? 0,                             sub: 'Total battles' },
          { label: 'Volume',    value: `${((stats?.monthVolumeKg ?? 0) / 1000).toFixed(1)}T`, sub: 'Kg this month' },
          { label: 'Streak',    value: stats?.streak ?? 0,                                    sub: 'Days unbroken' },
          { label: 'Routines',  value: routines.length,                                       sub: 'Active programs' },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-iron p-5 relative overflow-hidden"
            style={i === 0 ? { borderLeft: '3px solid #c0392b' } : {}}
          >
            <p className="font-title text-ghost text-xs tracking-widest uppercase mb-2">{s.label}</p>
            <p className="font-display text-4xl text-bone leading-none">{s.value}</p>
            <p className="text-ghost text-xs mt-1 tracking-wide">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Rutinas */}
      <div>
        <div className="section-label mb-4">My Routines</div>
        {routines.length === 0 ? (
          <p className="text-ghost font-body text-sm tracking-wide">
            No tenés rutinas todavía. Creá una o suscribite a una del War Codex.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {routines.map(r => (
              <div key={r.id} className="bg-abyss border border-iron p-5">
                <p className="font-title text-base font-bold text-bone mb-1">{r.name}</p>
                <p className="text-ghost text-xs tracking-wide">{r.days_per_week}d/week</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
