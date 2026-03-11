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
    <div className="p-4 md:p-10 pb-24 md:pb-10">

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
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
                      className="text-ghost text-[10px] tracking-[0.2em] uppercase mb-2 block hover:text-ash transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myRoutines.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-ghost font-title text-xs tracking-widest uppercase">No routines forged yet</p>
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
                <div key={routine.id}
                  className="flex flex-col transition-all duration-200"
                  style={{
                    background: '#0e0d10',
                    border: `1px solid ${isExpanded ? '#7a0000' : '#1a181e'}`,
                  }}>

                  {/* Card header */}
                  <div className="p-5 cursor-pointer select-none"
                    onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-title text-base font-bold text-bone leading-snug">{routine.name}</p>
                        {routine.description && (
                          <p className="text-ghost text-xs mt-1 leading-relaxed line-clamp-2">{routine.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {routine.is_public && (
                          <span className="text-[9px] font-title tracking-widest uppercase px-1.5 py-0.5"
                            style={{ background: '#0e2a1a', border: '1px solid #1a5c3a', color: '#4caf7d' }}>
                            public
                          </span>
                        )}
                        <span className="text-ghost text-lg">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-title text-[10px] tracking-widest uppercase px-2.5 py-1"
                        style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#6e6880' }}>
                        {routine.days_per_week}d / week
                      </span>
                      <span className="font-title text-[10px] tracking-widest uppercase px-2.5 py-1"
                        style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#6e6880' }}>
                        {routine.routine_exercises.length} exercises
                      </span>
                      <span className="font-title text-[10px] tracking-widest uppercase px-2.5 py-1"
                        style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#6e6880' }}>
                        {days.length} days
                      </span>
                    </div>
                  </div>

                  {/* Días expandidos */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #1a181e' }}>
                      {days.map(day => {
                        const dayExs = routine.routine_exercises
                          .filter(re => re.day_number === day)
                          .sort((a, b) => a.position - b.position)

                        const muscleGroups = Array.from(new Set(
                          dayExs.map(re => (re.exercises as { muscle_group: string })?.muscle_group).filter(Boolean)
                        ))

                        return (
                          <div key={day}
                            className="flex items-center gap-4 px-5 py-4 transition-all duration-150 cursor-pointer"
                            style={{ borderBottom: '1px solid #1a181e' }}
                            onClick={() => startWorkout(routine.id, day)}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                            {/* Day number */}
                            <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center"
                              style={{ border: '1px solid #7a0000', background: '#2e1a1a' }}>
                              <p className="font-title text-[9px] tracking-widest uppercase text-ghost">Day</p>
                              <p className="font-display text-lg text-crimson leading-none">{day}</p>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-1 mb-1">
                                {muscleGroups.slice(0, 4).map((mg: string) => (
                                  <span key={mg} className="font-title text-[9px] tracking-widest uppercase px-1.5 py-0.5"
                                    style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#b0a8bc' }}>
                                    {mg}
                                  </span>
                                ))}
                              </div>
                              <p className="text-ghost text-[10px] tracking-wide">
                                {dayExs.length} exercises · {dayExs.reduce((sum, re) => sum + re.target_sets, 0)} sets total
                              </p>
                            </div>

                            {/* Start */}
                            <button
                              className="flex-shrink-0 font-title text-xs tracking-widest uppercase px-4 py-2.5 transition-all duration-150"
                              style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#c0392b')}
                              onMouseLeave={e => (e.currentTarget.style.background = '#7a0000')}
                              onClick={e => { e.stopPropagation(); startWorkout(routine.id, day) }}>
                              ⚔ Start
                            </button>
                          </div>
                        )
                      })}

                      {/* Edit / Delete */}
                      <div className="flex items-center justify-end gap-2 px-5 py-3"
                        style={{ borderTop: '1px solid #1a181e' }}>
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