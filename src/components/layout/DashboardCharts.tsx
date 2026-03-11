'use client'

import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'
import type { WeeklyVolume, MuscleFrequency } from '@/lib/queries/sessions'

interface Props {
  username: string
  stats: {
    weeklyVolume: WeeklyVolume[]
    muscleFrequency: MuscleFrequency[]
    totalSessions: number
    totalVolume: number
    avgDuration: number
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2" style={{ background: '#1a181e', border: '1px solid #4a4455' }}>
      <p className="font-title text-[10px] tracking-widest uppercase text-ghost mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-title text-xs font-bold" style={{ color: p.color }}>
          {p.value.toLocaleString()} {p.name === 'volume' ? 'kg' : ''}
        </p>
      ))}
    </div>
  )
}

export default function DashboardCharts({ username, stats }: Props) {
  const { weeklyVolume, muscleFrequency, totalSessions, totalVolume, avgDuration } = stats

  const hasData = totalSessions > 0

  // Formatear labels de semana
  const chartData = weeklyVolume.map(w => ({
    ...w,
    label: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  // Max para escalar la barra de músculos
  const maxSets = muscleFrequency[0]?.sets ?? 1

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          War <span className="text-crimson">Room</span>
        </h1>
        <p className="text-ghost text-xs tracking-widest uppercase mt-1">Last 30 days</p>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4"
          style={{ border: '1px dashed #2e1a1a' }}>
          <p className="font-title text-xs tracking-widest uppercase text-ghost">No sessions recorded yet</p>
          <Link href="/routines"
            className="font-title text-xs tracking-widest uppercase px-6 py-2.5"
            style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}>
            Start Your First Workout
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Sessions', value: totalSessions },
              { label: 'Total Volume', value: `${(totalVolume / 1000).toFixed(1)}k kg` },
              { label: 'Avg Duration', value: `${avgDuration}m` },
            ].map(stat => (
              <div key={stat.label} className="p-4 text-center"
                style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
                <p className="font-display text-xl md:text-2xl text-crimson mb-1">{stat.value}</p>
                <p className="font-title text-[9px] tracking-widest uppercase text-ghost">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Volumen semanal */}
          <div style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid #1a181e' }}>
              <p className="font-title text-xs tracking-widest uppercase text-ghost">Weekly Volume</p>
              <p className="font-title text-[10px] tracking-widest uppercase text-ghost/50">kg lifted</p>
            </div>
            <div className="p-4" style={{ height: '200px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6e6880', fontSize: 9, fontFamily: 'var(--font-cinzel)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="volume" fill="#7a0000" radius={[2, 2, 0, 0]}
                      activeBar={{ fill: '#c0392b' }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-ghost text-xs font-title tracking-widest uppercase">No data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sessions por semana */}
          {chartData.length > 1 && (
            <div style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid #1a181e' }}>
                <p className="font-title text-xs tracking-widest uppercase text-ghost">Session Frequency</p>
                <p className="font-title text-[10px] tracking-widest uppercase text-ghost/50">sessions / week</p>
              </div>
              <div className="p-4" style={{ height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6e6880', fontSize: 9, fontFamily: 'var(--font-cinzel)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <CartesianGrid stroke="#1a181e" vertical={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4a4455' }} />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#c0392b"
                      strokeWidth={2}
                      dot={{ fill: '#7a0000', r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: '#e74c3c', r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Frecuencia por músculo */}
          {muscleFrequency.length > 0 && (
            <div style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
              <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid #1a181e' }}>
                <p className="font-title text-xs tracking-widest uppercase text-ghost">Muscle Focus</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {muscleFrequency.map(m => (
                  <div key={m.muscle_group}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-title text-[10px] tracking-widest uppercase text-bone">
                        {m.muscle_group}
                      </span>
                      <span className="font-title text-[10px] tracking-widest text-ghost">
                        {m.sets} sets
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden" style={{ background: '#1a181e' }}>
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${(m.sets / maxSets) * 100}%`,
                          background: m.sets === maxSets
                            ? 'linear-gradient(90deg, #7a0000, #e74c3c)'
                            : '#4a4455',
                          boxShadow: m.sets === maxSets ? '0 0 6px rgba(192,57,43,0.4)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}