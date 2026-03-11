'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { subscribeToRoutine, unsubscribeFromRoutine, deleteRoutine } from '@/lib/mutations/routines'
import type { RoutineWithAuthor, RoutineWithExercises } from '@/lib/queries/routines'

interface Props {
  publicRoutines: RoutineWithAuthor[]
  myRoutines: RoutineWithExercises[]
  subscribedIds: number[]
  userId: string
}

type Tab = 'codex' | 'mine'


export default function RoutinesFeed({ publicRoutines, myRoutines, subscribedIds, userId }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('codex')
  const [subs, setSubs] = useState<Set<number>>(new Set(subscribedIds))
  const [loading, setLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expandedRoutine, setExpandedRoutine] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const allTags = ['all', ...Array.from(new Set(publicRoutines.flatMap(r => r.tags ?? [])))]
  const filtered = filter === 'all' ? publicRoutines : publicRoutines.filter(r => r.tags?.includes(filter))

  const toggleSubscription = async (routineId: number) => {
    setLoading(routineId)
    const isSubbed = subs.has(routineId)
    if (isSubbed) {
      await unsubscribeFromRoutine(userId, routineId)
      setSubs(prev => { const n = new Set(prev); n.delete(routineId); return n })
    } else {
      await subscribeToRoutine(userId, routineId)
      setSubs(prev => new Set(prev).add(routineId))
    }
    setLoading(null)
  }

  const handleDelete = async (routineId: number) => {
    if (!confirm('Delete this routine? This cannot be undone.')) return
    setDeletingId(routineId)
    await deleteRoutine(routineId)
    router.refresh()
    setDeletingId(null)
  }

  const startWorkout = (routineId: number, day: number) => {
    router.push(`/workout?routineId=${routineId}&day=${day}`)
  }

  return (
    <div className="p-10">
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <div className="flex items-end justify-between">
          <div>
            <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
            <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
              War <span className="text-crimson">Codex</span>
            </h1>
          </div>
          <Link href="/routines/create"
            className="font-title text-xs tracking-widest uppercase px-4 py-2 transition-all duration-150 flex-shrink-0 mb-1"
            style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}>
            + Forge Routine
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-iron mb-8">
        {([['codex', 'War Codex'], ['mine', 'My Routines']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-6 py-3 font-title text-xs tracking-widest uppercase transition-all duration-150"
            style={{
              color: tab === t ? '#f0e8d5' : '#6e6880',
              borderBottom: tab === t ? '2px solid #c0392b' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {label}
            {t === 'mine' && myRoutines.length > 0 && (
              <span className="ml-2 font-title text-[10px] px-1.5 py-0.5"
                style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                {myRoutines.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── WAR CODEX TAB ── */}
      {tab === 'codex' && (
        <>
          <div className="flex gap-1 mb-8 flex-wrap">
            {allTags.map(tag => (
              <button key={tag} onClick={() => setFilter(tag)}
                className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
                style={{
                  background: filter === tag ? '#7a0000' : '#1a181e',
                  border: `1px solid ${filter === tag ? '#c0392b' : '#4a4455'}`,
                  color: filter === tag ? '#d4c9b0' : '#8a8090',
                }}>
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-0.5">
            {filtered.map(routine => {
              const isSubbed = subs.has(routine.id)
              const isLoading = loading === routine.id
              return (
                <div key={routine.id}
                  className="relative overflow-hidden transition-all duration-200 group"
                  style={{ background: '#0e0d10', border: '1px solid #1a181e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0e0d10')}>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
                    style={{ background: '#7a0000' }} />
                  <div className="p-5">
                  <Link
                    href={`/profile/${(routine.profiles as { username: string })?.username}`}
                    className="text-ghost text-[10px] tracking-[0.2em] uppercase mb-2 hover:text-ash transition-colors"
                    onClick={e => e.stopPropagation()}>
                    {(routine.profiles as { username: string })?.username ?? 'unknown'}
                  </Link>
                    <p className="font-title text-base font-bold text-bone mb-3 leading-snug">{routine.name}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {routine.tags?.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] tracking-wide uppercase px-2 py-0.5 font-title"
                          style={{
                            background: i === 0 ? '#2e1a1a' : '#1a181e',
                            border: `1px solid ${i === 0 ? '#7a0000' : '#4a4455'}`,
                            color: i === 0 ? '#e74c3c' : '#8a8090',
                          }}>
                          {tag}
                        </span>
                      ))}
                      {routine.days_per_week && (
                        <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 font-title"
                          style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#8a8090' }}>
                          {routine.days_per_week}d/week
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #1a181e' }}>
                      <span className="text-ghost text-[10px] tracking-wide">
                        {routine.subscribers_count.toLocaleString()} warriors
                      </span>
                      <button onClick={() => toggleSubscription(routine.id)} disabled={isLoading}
                        className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-200"
                        style={{
                          background: isSubbed ? '#7a0000' : 'transparent',
                          border: `1px solid ${isSubbed ? '#c0392b' : '#7a0000'}`,
                          color: isSubbed ? '#d4c9b0' : '#c0392b',
                          opacity: isLoading ? 0.5 : 1,
                        }}>
                        {isLoading ? '...' : isSubbed ? '✓ Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── MY ROUTINES TAB ── */}
      {tab === 'mine' && (
        <div className="flex flex-col gap-3">
          {myRoutines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-ghost font-title text-xs tracking-widest uppercase">
                No routines forged yet
              </p>
              <Link href="/routines/create"
                className="font-title text-xs tracking-widest uppercase px-6 py-2 transition-all duration-150"
                style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}>
                + Forge Your First Routine
              </Link>
            </div>
          ) : (
            myRoutines.map(routine => {
              const isExpanded = expandedRoutine === routine.id
              const days = Array.from(new Set(routine.routine_exercises.map(re => re.day_number))).sort()

              return (
                <div key={routine.id} style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>

                  {/* Routine header */}
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: isExpanded ? '1px solid #1a181e' : 'none' }}>
                    <div className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}>
                      <span className="font-title text-bone text-sm"
                        style={{ color: isExpanded ? '#e74c3c' : '#f0e8d5' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-title text-base font-bold text-bone">{routine.name}</p>
                          {routine.is_public && (
                            <span className="text-[9px] font-title tracking-widest uppercase px-1.5 py-0.5"
                              style={{ background: '#0e2a1a', border: '1px solid #1a5c3a', color: '#4caf7d' }}>
                              public
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-ghost text-[10px] tracking-wide">{routine.days_per_week}d/week</span>
                          <span className="text-ghost text-[10px] tracking-wide">·</span>
                          <span className="text-ghost text-[10px] tracking-wide">
                            {routine.routine_exercises.length} exercises
                          </span>
                          {routine.tags && routine.tags.length > 0 && (
                            <>
                              <span className="text-ghost text-[10px]">·</span>
                              <div className="flex gap-1">
                                {routine.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-[9px] font-title tracking-wide uppercase px-1.5 py-0.5"
                                    style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/routines/edit/${routine.id}`}
                        className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
                        style={{ border: '1px solid #4a4455', color: '#6e6880' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6e6880'; e.currentTarget.style.color = '#b0a8bc' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(routine.id)}
                        disabled={deletingId === routine.id}
                        className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
                        style={{ border: '1px solid #2e1a1a', color: '#6e6880', opacity: deletingId === routine.id ? 0.5 : 1 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#7a0000'; e.currentTarget.style.color = '#e74c3c' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e1a1a'; e.currentTarget.style.color = '#6e6880' }}>
                        {deletingId === routine.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Días expandidos */}
                  {isExpanded && (
                    <div className="flex flex-col gap-0">
                      {days.map(day => {
                        const dayExercises = routine.routine_exercises
                          .filter(re => re.day_number === day)
                          .sort((a, b) => a.position - b.position)

                        return (
                          <div key={day} className="flex items-start gap-0"
                            style={{ borderBottom: '1px solid #1a181e' }}>

                            {/* Day label */}
                            <div className="w-28 flex-shrink-0 px-5 py-3 flex flex-col gap-1"
                              style={{ borderRight: '1px solid #1a181e' }}>
                              <p className="font-title text-[10px] tracking-widest uppercase text-ghost">Day</p>
                              <p className="font-display text-crimson text-lg">{day}</p>
                              <button
                                onClick={() => startWorkout(routine.id, day)}
                                className="mt-2 font-title text-[9px] tracking-widest uppercase px-2 py-1 transition-all duration-150 w-full"
                                style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#c0392b')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#7a0000')}>
                                ⚔ Start
                              </button>
                            </div>

                            {/* Exercises */}
                            <div className="flex-1 py-2">
                              {dayExercises.map((re, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-1.5">
                                  <p className="font-title text-sm text-bone">
                                    {(re.exercises as { name: string })?.name}
                                  </p>
                                  <p className="text-ghost text-[10px] tracking-wide">
                                    {re.target_sets} × {re.target_reps ?? '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}