'use client'

import { useState } from 'react'
import type { SessionDetail } from '@/lib/queries/sessions'

interface Props {
  sessions: SessionDetail[]
  initialYear: number
  initialMonth: number
  userId: string
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDuration(started: string, finished: string | null): string {
  if (!finished) return '—'
  const diff = new Date(finished).getTime() - new Date(started).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function SessionCalendar({ sessions, initialYear, initialMonth, userId }: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [monthSessions, setMonthSessions] = useState<SessionDetail[]>(sessions)
  const [loading, setLoading] = useState(false)

  const navigateMonth = async (dir: 1 | -1) => {
    let newMonth = month + dir
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }

    setLoading(true)
    setSelectedDay(null)

    const res = await fetch(`/api/sessions?userId=${userId}&year=${newYear}&month=${newMonth}`)
    const data = await res.json()
    setMonthSessions(data)
    setMonth(newMonth)
    setYear(newYear)
    setLoading(false)
  }

  // Días del mes
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  // Lunes = 0, ajustar para que la semana empiece en lunes
  const startOffset = (firstDay.getDay() + 6) % 7

  // Mapa de día → sesión
  const sessionByDay: Record<number, SessionDetail> = {}
  monthSessions.forEach(s => {
    const d = new Date(s.started_at).getDate()
    sessionByDay[d] = s
  })

  const selectedSession = selectedDay ? sessionByDay[selectedDay] : null

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          Battle <span className="text-crimson">Log</span>
        </h1>
      </header>

      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Calendario ── */}
        <div>
          {/* Nav mes */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateMonth(-1)}
              className="font-title text-xs tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
              style={{ border: '1px solid #4a4455', color: '#6e6880' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#f0e8d5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
              ← Prev
            </button>
            <div className="text-center">
              <p className="font-title text-base font-bold text-bone tracking-wide">
                {MONTHS[month - 1]}
              </p>
              <p className="font-title text-xs text-ghost tracking-widest">{year}</p>
            </div>
            <button onClick={() => navigateMonth(1)}
              className="font-title text-xs tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
              style={{ border: '1px solid #4a4455', color: '#6e6880' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#f0e8d5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
              Next →
            </button>
          </div>

          {/* Stats del mes */}
          <div className="grid grid-cols-3 gap-1 mb-4">
            {[
              { label: 'Sessions', value: monthSessions.length },
              { label: 'Volume', value: `${Math.round(monthSessions.reduce((s, se) => s + se.total_volume, 0) / 1000)}k kg` },
              { label: 'Exercises', value: monthSessions.reduce((s, se) => s + se.exercises.length, 0) },
            ].map(stat => (
              <div key={stat.label} className="p-3 text-center"
                style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
                <p className="font-display text-lg text-crimson">{stat.value}</p>
                <p className="font-title text-[9px] tracking-widest uppercase text-ghost">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-iron">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-2 text-center">
                  <span className="font-title text-[9px] tracking-widest uppercase text-ghost">{d}</span>
                </div>
              ))}
            </div>

            {/* Días */}
            <div className="grid grid-cols-7">
              {/* Offset inicial */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12"
                  style={{ borderRight: '1px solid #1a181e', borderBottom: '1px solid #1a181e' }} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const hasSession = !!sessionByDay[day]
                const isSelected = selectedDay === day
                const isToday = day === new Date().getDate() &&
                  month === new Date().getMonth() + 1 &&
                  year === new Date().getFullYear()

                return (
                  <div key={day}
                    className="h-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative"
                    style={{
                      borderRight: '1px solid #1a181e',
                      borderBottom: '1px solid #1a181e',
                      background: isSelected ? '#2e1a1a' : hasSession ? '#1a181e' : 'transparent',
                    }}
                    onClick={() => hasSession && setSelectedDay(isSelected ? null : day)}
                    onMouseEnter={e => { if (hasSession) e.currentTarget.style.background = '#2e1a1a' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = hasSession ? '#1a181e' : 'transparent' }}>

                    <span className="font-title text-xs"
                      style={{ color: isSelected ? '#f0e8d5' : isToday ? '#e74c3c' : hasSession ? '#b0a8bc' : '#4a4455' }}>
                      {day}
                    </span>

                    {/* Dot indicador */}
                    {hasSession && (
                      <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                        style={{
                          background: isSelected ? '#e74c3c' : '#7a0000',
                          boxShadow: isSelected ? '0 0 6px rgba(192,57,43,0.6)' : 'none',
                        }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-ghost text-[10px] tracking-wide mt-3 text-center">
            Tap a highlighted day to view session details
          </p>
        </div>

        {/* ── Detalle de sesión ── */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="font-title text-xs tracking-widest uppercase text-ghost">Loading...</p>
            </div>
          ) : selectedSession ? (
            <div>
              {/* Session header */}
              <div className="p-5 mb-3"
                style={{ background: '#0e0d10', border: '1px solid #1a181e', borderTopColor: '#7a0000', borderTopWidth: '2px' }}>
                <p className="font-title text-[10px] tracking-widest uppercase text-ghost mb-1">
                  {new Date(selectedSession.started_at).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
                <p className="font-title text-base font-bold text-bone mb-3">
                  {selectedSession.routine_name ?? 'Quick Session'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Duration', value: formatDuration(selectedSession.started_at, selectedSession.finished_at) },
                    { label: 'Volume', value: `${selectedSession.total_volume.toLocaleString()} kg` },
                    { label: 'Exercises', value: selectedSession.exercises.length },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-2"
                      style={{ background: '#1a181e', border: '1px solid #252229' }}>
                      <p className="font-display text-sm text-crimson">{stat.value}</p>
                      <p className="font-title text-[9px] tracking-widest uppercase text-ghost">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ejercicios */}
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {selectedSession.exercises.map(ex => (
                  <div key={ex.exercise_id}
                    style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: '1px solid #1a181e' }}>
                      <p className="font-title text-sm font-bold text-bone">{ex.exercise_name}</p>
                      <span className="font-title text-[9px] tracking-widest uppercase px-1.5 py-0.5"
                        style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#6e6880' }}>
                        {ex.muscle_group}
                      </span>
                    </div>
                    <div className="px-4 py-2">
                      {/* Header sets */}
                      <div className="grid grid-cols-4 gap-2 pb-1 mb-1"
                        style={{ borderBottom: '1px solid #1a181e' }}>
                        {['Set', 'kg', 'Reps', '✓'].map(h => (
                          <p key={h} className="font-title text-[9px] tracking-widest uppercase text-ghost text-center">{h}</p>
                        ))}
                      </div>
                      {ex.sets.map((s, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 py-1.5"
                          style={{ opacity: s.completed ? 1 : 0.4 }}>
                          <p className="font-title text-xs text-ghost text-center">{s.set_number}</p>
                          <p className="font-title text-xs text-bone text-center font-semibold">
                            {s.weight_kg ?? '—'}
                          </p>
                          <p className="font-title text-xs text-bone text-center font-semibold">
                            {s.reps ?? '—'}
                          </p>
                          <p className="text-center text-xs"
                            style={{ color: s.completed ? '#c0392b' : '#4a4455' }}>
                            {s.completed ? '✓' : '○'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3"
              style={{ border: '1px dashed #2e1a1a' }}>
              <p className="font-title text-xs tracking-widest uppercase text-ghost">
                Select a day to view session
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}