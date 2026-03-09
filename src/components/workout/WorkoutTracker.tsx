'use client'

import { useState, useEffect } from 'react'
import { useWorkoutStore } from '@/lib/store/workout'
import { createSession, saveSets, closeSession, createCustomExercise } from '@/lib/mutations/sessions'
import type { Exercise } from '@/types/database'

interface Props {
  exercises: Exercise[]
  userId: string
  routineId: number | null
  routineName: string | null
  routineDay: number | null
  preloadedExercises: any[]
}
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps']

type PickerTab = 'browse' | 'create'

export default function WorkoutTracker({ exercises, userId, routineId, routineName, routineDay, preloadedExercises }: Props) {
  const store = useWorkoutStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<PickerTab>('browse')

  // Formulario nuevo ejercicio
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState('chest')
  const [newEquipment, setNewEquipment] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Ejercicios locales (incluye los custom recién creados sin recargar)
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises)

  useEffect(() => {
    if (!store.sessionId) {
      const sessionName = routineName && routineDay
        ? `${routineName} — Day ${routineDay}`
        : 'Quick Session'

      createSession(userId, routineId ?? undefined).then(id => {
        if (!id) return
        store.startSession(id, sessionName)

        // Pre-cargar ejercicios de la rutina
        if (preloadedExercises.length > 0) {
          preloadedExercises.forEach((re, idx) => {
            const exercise = exercises.find(ex => ex.id === re.exercise_id)
            if (exercise) {
              store.addExercise(exercise, re.target_sets ?? 3)
              if (idx === 0) store.setCurrentExercise(0)
            }
          })
        }
      })
    }
  }, [])

  const filteredExercises = localExercises.filter(ex => {
    const matchMuscle = filter === 'all' || ex.muscle_group === filter
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const notAdded = !store.activeExercises.some(a => a.exercise.id === ex.id)
    return matchMuscle && matchSearch && notAdded
  })

  const addExercise = (ex: Exercise) => {
    store.addExercise(ex, 3)
    store.setCurrentExercise(store.activeExercises.length)
    setShowExercisePicker(false)
    setSearch('')
  }

  const removeExercise = (idx: number) => {
    store.removeExercise(idx)
  }

  const handleCreateExercise = async () => {
    if (!newName.trim()) {
      setCreateError('Name is required')
      return
    }
    setCreating(true)
    setCreateError(null)

    const id = await createCustomExercise(userId, newName.trim(), newMuscle, newEquipment.trim() || null)

    if (!id) {
      setCreateError('Failed to create exercise')
      setCreating(false)
      return
    }

    // Agregamos el ejercicio localmente sin recargar la página
    const newExercise: Exercise = {
      id,
      name: newName.trim(),
      muscle_group: newMuscle,
      secondary_muscles: null,
      equipment: newEquipment.trim() || null,
      is_custom: true,
      created_by: userId,
      created_at: new Date().toISOString(),
    }

    setLocalExercises(prev => [...prev, newExercise])
    addExercise(newExercise)

    // Reset form
    setNewName('')
    setNewEquipment('')
    setNewMuscle('chest')
    setCreating(false)
  }

  const finishSession = async () => {
    if (!store.sessionId) return
    setSaving(true)

    const allSets = store.activeExercises.flatMap((ex) =>
      ex.sets.map((s, setIdx) => ({
        session_id: store.sessionId!,
        exercise_id: ex.exercise.id,
        set_number: setIdx + 1,
        weight_kg: s.weightKg ? parseFloat(s.weightKg) : null,
        reps: s.reps ? parseInt(s.reps) : null,
        completed: s.completed,
      }))
    )

    const totalVolume = allSets.reduce((sum, s) => {
      return sum + ((s.weight_kg ?? 0) * (s.reps ?? 0))
    }, 0)

    await saveSets(allSets)
    await closeSession(store.sessionId, totalVolume)
    store.resetSession()
    setSaving(false)
  }

  const progress = store.getProgress()
  const currentEx = store.activeExercises[store.currentExerciseIdx]

  return (
    <div className="p-10 min-h-screen">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative flex items-start justify-between">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <div>
          <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
          <div>
            <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
            <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
              Active <span className="text-crimson">Assault</span>
            </h1>
            {routineName && routineDay && (
              <p className="text-ghost text-xs tracking-widest uppercase mt-1">
                {routineName} · Day {routineDay}
              </p>
            )}
            {!routineName && (
              <p className="text-ghost text-xs tracking-widest uppercase mt-1">Quick Session</p>
            )}
          </div>
        </div>
        <button className="btn-primary w-48" onClick={finishSession}
          disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Finish Session'}
        </button>
      </header>

      <div className="grid grid-cols-5 gap-6">

        {/* ── Exercise list ── */}
        <div className="col-span-2">
          <div className="section-label mb-4">Exercises</div>

          <div className="h-0.5 bg-iron mb-1 overflow-hidden">
            <div className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7a0000, #e74c3c)',
                boxShadow: '0 0 8px #c0392b',
              }} />
          </div>
          <div className="flex justify-between mb-5">
            <span className="text-ghost text-[10px] tracking-widest">{store.getDoneSets()}/{store.getTotalSets()} SETS</span>
            <span className="text-crimson text-[10px] tracking-widest">{progress}%</span>
          </div>

          {store.activeExercises.length === 0 ? (
            <p className="text-ghost text-xs tracking-wide font-title uppercase mb-4">No exercises added yet</p>
          ) : (
            <div className="flex flex-col gap-0.5 mb-4">
              {store.activeExercises.map((ex, i) => {
                const allDone = ex.sets.every(s => s.completed)
                const active = i === store.currentExerciseIdx
                return (
                  <div key={ex.exercise.id}
                    className="flex items-center justify-between p-3 cursor-pointer transition-all duration-150 group"
                    style={{
                      background: active ? '#252229' : '#1a181e',
                      borderLeft: `2px solid ${active ? '#c0392b' : allDone ? '#6e6880' : 'transparent'}`,
                      opacity: allDone && !active ? 0.6 : 1,
                    }}
                    onClick={() => store.setCurrentExercise(i)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-title text-sm text-bone font-semibold truncate">{ex.exercise.name}</p>
                        {ex.exercise.is_custom && (
                          <span className="text-[9px] font-title tracking-widest uppercase px-1.5 py-0.5 flex-shrink-0"
                            style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                            custom
                          </span>
                        )}
                      </div>
                      <p className="text-ghost text-[10px] tracking-wide uppercase mt-0.5">{ex.exercise.muscle_group}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {ex.sets.map((s, j) => (
                          <div key={j} className="w-2 h-2 rounded-full transition-all duration-200"
                            style={{
                              background: s.completed ? '#c0392b' : '#6e6880',
                              boxShadow: s.completed ? '0 0 6px rgba(192,57,43,0.5)' : 'none',
                            }} />
                        ))}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeExercise(i) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-5 h-5 flex items-center justify-center text-ghost hover:text-ember text-xs ml-1"
                        title="Remove exercise"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Toggle picker */}
          <button
            onClick={() => setShowExercisePicker(v => !v)}
            className="w-full py-2 font-title text-xs tracking-widest uppercase transition-all duration-150 mb-3"
            style={{
              background: showExercisePicker ? '#2e1a1a' : '#1a181e',
              border: `1px solid ${showExercisePicker ? '#c0392b' : '#6e6880'}`,
              color: showExercisePicker ? '#e74c3c' : '#b0a8bc',
            }}
          >
            {showExercisePicker ? '✕ Close' : '+ Add Exercise'}
          </button>

          {/* Exercise picker */}
          {showExercisePicker && (
            <div className="border border-iron" style={{ background: '#0e0d10' }}>

              {/* Tabs Browse / Create */}
              <div className="flex border-b border-iron">
                {(['browse', 'create'] as PickerTab[]).map(tab => (
                  <button key={tab} onClick={() => setPickerTab(tab)}
                    className="flex-1 py-2 font-title text-[10px] tracking-widest uppercase transition-all duration-150"
                    style={{
                      background: pickerTab === tab ? '#1a181e' : 'transparent',
                      color: pickerTab === tab ? '#f0e8d5' : '#6e6880',
                      borderBottom: pickerTab === tab ? '2px solid #c0392b' : '2px solid transparent',
                    }}>
                    {tab === 'browse' ? 'Browse' : '+ Create New'}
                  </button>
                ))}
              </div>

              {pickerTab === 'browse' ? (
                <>
                  {/* Filtros */}
                  <div className="flex flex-wrap gap-0.5 p-2 border-b border-iron">
                    {MUSCLE_GROUPS.map(mg => (
                      <button key={mg} onClick={() => setFilter(mg)}
                        className="font-title text-[9px] tracking-widest uppercase px-2 py-1 transition-all duration-150"
                        style={{
                          background: filter === mg ? '#7a0000' : 'transparent',
                          color: filter === mg ? '#f0e8d5' : '#6e6880',
                        }}>
                        {mg}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="p-2 border-b border-iron">
                    <input className="input-dark w-full px-3 py-1.5 text-xs"
                      placeholder="Search..." value={search}
                      onChange={e => setSearch(e.target.value)} autoFocus />
                  </div>
                  {/* Lista */}
                  <div className="max-h-52 overflow-y-auto">
                    {filteredExercises.length === 0 ? (
                      <p className="text-ghost text-xs p-3 tracking-wide">No exercises found</p>
                    ) : (
                      filteredExercises.map(ex => (
                        <button key={ex.id} onClick={() => addExercise(ex)}
                          className="w-full text-left px-3 py-2.5 transition-all duration-150 border-b border-iron/50"
                          style={{ background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-title text-sm text-bone font-semibold">{ex.name}</p>
                            {ex.is_custom && (
                              <span className="text-[9px] font-title tracking-widest uppercase px-1 py-0.5"
                                style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                                custom
                              </span>
                            )}
                          </div>
                          <p className="text-ghost text-[10px] tracking-wide uppercase">
                            {ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ''}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* ── Create new exercise form ── */
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1">
                      Exercise Name *
                    </label>
                    <input
                      className="input-dark w-full px-3 py-2 text-sm"
                      placeholder="e.g. Hack Squat"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1">
                      Muscle Group *
                    </label>
                    <select
                      className="input-dark w-full px-3 py-2 text-sm"
                      value={newMuscle}
                      onChange={e => setNewMuscle(e.target.value)}
                      style={{ background: '#1a181e' }}
                    >
                      {MUSCLE_GROUPS.filter(m => m !== 'all').map(m => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1">
                      Equipment <span className="text-ghost/50">(optional)</span>
                    </label>
                    <input
                      className="input-dark w-full px-3 py-2 text-sm"
                      placeholder="e.g. barbell, dumbbell, machine..."
                      value={newEquipment}
                      onChange={e => setNewEquipment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateExercise()}
                    />
                  </div>

                  {createError && (
                    <p className="text-ember text-xs tracking-wide border border-blood/50 bg-rust/30 px-3 py-2">
                      {createError}
                    </p>
                  )}

                  <button
                    className="btn-primary mt-1"
                    onClick={handleCreateExercise}
                    disabled={creating}
                    style={{ opacity: creating ? 0.6 : 1 }}
                  >
                    {creating ? 'Creating...' : 'Create & Add'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Set Logger ── */}
        <div className="col-span-3">
          {currentEx ? (
            <div className="p-6"
              style={{ background: '#0e0d10', border: '1px solid #1a181e', borderTopColor: '#c0392b', borderTopWidth: '3px' }}>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-xl text-bone">{currentEx.exercise.name}</h2>
                {currentEx.exercise.is_custom && (
                  <span className="text-[9px] font-title tracking-widest uppercase px-1.5 py-0.5"
                    style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                    custom
                  </span>
                )}
              </div>
              <p className="text-ghost text-xs tracking-widest uppercase mb-6">
                {currentEx.exercise.muscle_group} · {currentEx.sets.length} sets
              </p>
              <table className="w-full mb-4">
                <thead>
                  <tr>
                    {['Set', 'kg', 'Reps', 'RPE', '✓'].map(h => (
                      <th key={h} className="font-title text-[10px] tracking-widest text-ghost uppercase pb-3 text-left border-b border-iron">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentEx.sets.map((s, setIdx) => (
                    <tr key={setIdx} style={{ opacity: s.completed ? 0.6 : 1 }}>
                      <td className="py-2.5 font-title text-xs text-ghost tracking-wide pr-3">SET {setIdx + 1}</td>
                      <td className="py-2.5 pr-3">
                        <input className="input-dark w-16 px-2 py-1.5 text-center text-sm"
                          type="number" placeholder="kg" value={s.weightKg}
                          onChange={e => store.updateSet(store.currentExerciseIdx, setIdx, 'weightKg', e.target.value)} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input className="input-dark w-16 px-2 py-1.5 text-center text-sm"
                          type="number" placeholder="reps" value={s.reps}
                          onChange={e => store.updateSet(store.currentExerciseIdx, setIdx, 'reps', e.target.value)} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input className="input-dark w-14 px-2 py-1.5 text-center text-sm"
                          type="number" placeholder="—" min="1" max="10" />
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => store.toggleSetComplete(store.currentExerciseIdx, setIdx)}
                          className="w-8 h-8 flex items-center justify-center transition-all duration-200 text-sm"
                          style={{
                            background: s.completed ? '#7a0000' : '#1a181e',
                            border: `1px solid ${s.completed ? '#c0392b' : '#6e6880'}`,
                            color: s.completed ? '#e74c3c' : '#6e6880',
                            boxShadow: s.completed ? '0 0 10px rgba(192,57,43,0.3)' : 'none',
                          }}>
                          {s.completed ? '✓' : '○'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2">
              <button onClick={() => store.addSet(store.currentExerciseIdx)}
                className="font-title text-xs tracking-widest uppercase text-ghost hover:text-ash transition-colors duration-150 border border-ghost/30 hover:border-ghost px-4 py-2">
                + Add Set
              </button>
              {currentEx.sets.length > 1 && (
                <button onClick={() => store.removeSet(store.currentExerciseIdx)}
                  className="font-title text-xs tracking-widest uppercase transition-colors duration-150 px-4 py-2"
                  style={{
                    color: '#6e6880',
                    border: '1px solid #2e1a1a',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#e74c3c'
                    e.currentTarget.style.borderColor = '#7a0000'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#6e6880'
                    e.currentTarget.style.borderColor = '#2e1a1a'
                  }}
                >
                  − Remove Set
                </button>
              )}
            </div>  
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4"
              style={{ border: '1px dashed #2e1a1a' }}>
              <p className="text-ghost font-title text-xs tracking-widest uppercase">
                Add an exercise to begin
              </p>
              <button onClick={() => setShowExercisePicker(true)}
                className="font-title text-xs tracking-widest uppercase px-6 py-2 transition-all duration-150"
                style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}>
                + Add Exercise
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}