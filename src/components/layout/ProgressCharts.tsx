'use client'

import type { SessionWithSets } from '@/types/database'

interface Props {
  sessions: SessionWithSets[]
}

export default function ProgressCharts({ sessions }: Props) {
  const completed = sessions.filter(s => s.finished_at)

  // Volumen por sesión para el gráfico
  const chartData = completed.slice(0, 20).reverse().map(s => ({
    date: new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: s.total_volume,
    duration: s.finished_at
      ? Math.round((new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 60000)
      : 0,
  }))

  const maxVolume = Math.max(...chartData.map(d => d.volume), 1)

  return (
    <div className="p-10">
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }}
        />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Battle Records</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          War <span className="text-crimson">Chronicle</span>
        </h1>
      </header>

      {completed.length === 0 ? (
        <p className="text-ghost font-title text-xs tracking-widest uppercase mt-12">
          No completed sessions yet. Begin your assault.
        </p>
      ) : (
        <>
          {/* Volume Chart */}
          <div className="mb-10">
            <div className="section-label mb-6">Volume History (last 20 sessions)</div>
            <div
              className="p-6"
              style={{ background: '#0e0d10', border: '1px solid #1a181e', borderTop: '3px solid #7a0000' }}
            >
              <div className="flex items-end gap-1.5 h-36">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div
                      className="absolute bottom-full mb-2 px-2 py-1 text-[10px] font-title text-bone whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{ background: '#1a181e', border: '1px solid #4a4455' }}
                    >
                      {d.volume.toFixed(0)}kg · {d.duration}min
                    </div>
                    <div
                      className="w-full transition-all duration-200"
                      style={{
                        height: `${Math.max((d.volume / maxVolume) * 100, 4)}%`,
                        background: i === chartData.length - 1
                          ? 'linear-gradient(180deg, #e74c3c, #7a0000)'
                          : 'linear-gradient(180deg, #7a0000, #2e1a1a)',
                        boxShadow: i === chartData.length - 1 ? '0 0 12px rgba(192,57,43,0.4)' : 'none',
                      }}
                    />
                    <span className="text-ghost text-[8px] tracking-wide rotate-45 origin-left hidden group-hover:block absolute -bottom-4">
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3">
                {chartData.length > 0 && (
                  <>
                    <span className="text-ghost text-[10px] tracking-wide">{chartData[0]?.date}</span>
                    <span className="text-ghost text-[10px] tracking-wide">{chartData[chartData.length - 1]?.date}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Session history */}
          <div>
            <div className="section-label mb-4">Recent Sessions</div>
            <div className="flex flex-col gap-0.5">
              {completed.map(s => {
                const duration = s.finished_at
                  ? Math.round((new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 60000)
                  : 0
                const exerciseNames = [...new Set(s.workout_sets.map(ws => ws.exercises?.name).filter(Boolean))]

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4"
                    style={{ background: '#0e0d10', border: '1px solid #1a181e' }}
                  >
                    <div>
                      <p className="font-title text-sm text-bone font-semibold mb-1">
                        {s.name ?? new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-ghost text-[10px] tracking-wide uppercase">
                        {exerciseNames.slice(0, 4).join(' · ')}{exerciseNames.length > 4 ? ` +${exerciseNames.length - 4}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="font-title text-sm text-crimson">{s.total_volume.toFixed(0)}<span className="text-ghost text-[10px] ml-1">kg</span></p>
                        <p className="text-ghost text-[10px] tracking-wide">volume</p>
                      </div>
                      <div>
                        <p className="font-title text-sm text-bone">{duration}<span className="text-ghost text-[10px] ml-1">min</span></p>
                        <p className="text-ghost text-[10px] tracking-wide">duration</p>
                      </div>
                      <div>
                        <p className="font-title text-sm text-bone">{s.workout_sets.filter(ws => ws.completed).length}</p>
                        <p className="text-ghost text-[10px] tracking-wide">sets done</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
