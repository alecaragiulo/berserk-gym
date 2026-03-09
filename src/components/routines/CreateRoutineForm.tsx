'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRoutine } from '@/lib/mutations/routines'
import type { Exercise } from '@/types/database'

interface Props {
  exercises: Exercise[]
  userId: string
}

interface DayExercise {
  exercise: Exercise
  target_sets: number
  target_reps: number | null
  notes: string
}

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps']
const SUGGESTED_TAGS = ['PUSH', 'PULL', 'LEGS', 'STRENGTH', 'HYPERTROPHY', 'ENDURANCE', 'FULL BODY', 'BULK', 'CARDIO']

export default function CreateRoutineForm({ exercises, userId }: Props) {
  const router = useRouter()

  // Info básica
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  // Ejercicios por día
  const [dayExercises, setDayExercises] = useState<Record<number, DayExercise[]>>({})

  // Picker
  const [activeDayPicker, setActiveDayPicker] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Submit
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim().toUpperCase()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setCustomTag('')
    }
  }

  const addExerciseToDay = (day: number, ex: Exercise) => {
    setDayExercises(prev => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { exercise: ex, target_sets: 3, target_reps: 10, notes: '' }],
    }))
    setActiveDayPicker(null)
    setSearch('')
  }

  const removeExerciseFromDay = (day: number, idx: number) => {
    setDayExercises(prev => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== idx),
    }))
  }

  const updateDayExercise = (
    day: number,
    idx: number,
    field: keyof Omit<DayExercise, 'exercise'>,
    value: string | number | null
  ) => {
    setDayExercises(prev => ({
      ...prev,
      [day]: (prev[day] ?? []).map((ex, i) => i === idx ? { ...ex, [field]: value } : ex),
    }))
  }

  const filteredExercises = (day: number) => exercises.filter(ex => {
    const matchMuscle = filter === 'all' || ex.muscle_group === filter
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const notAdded = !(dayExercises[day] ?? []).some(d => d.exercise.id === ex.id)
    return matchMuscle && matchSearch && notAdded
  })

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Routine name is required'); return }
    const totalExercises = Object.values(dayExercises).flat().length
    if (totalExercises === 0) { setError('Add at least one exercise'); return }

    setSaving(true)
    setError(null)

    const exercisesFlat = Object.entries(dayExercises).flatMap(([day, exs]) =>
      exs.map((ex, pos) => ({
        exercise_id: ex.exercise.id,
        day_number: parseInt(day),
        position: pos,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        notes: ex.notes || null,
      }))
    )

    const id = await createRoutine(userId, {
      name: name.trim(),
      description: description.trim(),
      days_per_week: daysPerWeek,
      is_public: isPublic,
      tags,
      exercises: exercisesFlat,
    })

    setSaving(false)
    if (!id) { setError('Failed to create routine. Try again.'); return }
    router.push('/routines')
  }

  return (
    <div className="p-10 min-h-screen">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">War Codex</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          Forge a <span className="text-crimson">Routine</span>
        </h1>
      </header>

      <div className="grid grid-cols-5 gap-8 max-w-6xl">

        {/* ── Info básica — 2 cols ── */}
        <div className="col-span-2 flex flex-col gap-5">
          <div className="section-label">Basic Info</div>

          {/* Nombre */}
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Routine Name *
            </label>
            <input className="input-dark w-full px-4 py-2.5 text-sm"
              placeholder="e.g. Black Swordsman Split"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Descripción */}
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Description
            </label>
            <textarea
              className="input-dark w-full px-4 py-2.5 text-sm resize-none"
              placeholder="What's this routine about?"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Días por semana */}
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Days per week
            </label>
            <div className="flex gap-1">
              {[2, 3, 4, 5, 6].map(d => (
                <button key={d} onClick={() => setDaysPerWeek(d)}
                  className="w-10 h-10 font-title text-sm transition-all duration-150"
                  style={{
                    background: daysPerWeek === d ? '#7a0000' : '#1a181e',
                    border: `1px solid ${daysPerWeek === d ? '#c0392b' : '#4a4455'}`,
                    color: daysPerWeek === d ? '#f0e8d5' : '#6e6880',
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {SUGGESTED_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className="font-title text-[10px] tracking-widest uppercase px-2.5 py-1 transition-all duration-150"
                  style={{
                    background: tags.includes(tag) ? '#7a0000' : '#1a181e',
                    border: `1px solid ${tags.includes(tag) ? '#c0392b' : '#4a4455'}`,
                    color: tags.includes(tag) ? '#f0e8d5' : '#6e6880',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <input className="input-dark flex-1 px-3 py-1.5 text-xs"
                placeholder="Custom tag..."
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomTag()} />
              <button onClick={addCustomTag}
                className="font-title text-xs tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
                style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#6e6880' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#f0e8d5' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
                + Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag: string) => (
                  <span key={tag}
                    className="font-title text-[10px] tracking-widest uppercase px-2 py-0.5 flex items-center gap-1"
                    style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="hover:text-bone">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibilidad */}
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Visibility
            </label>
            <div className="flex">
              {[
                { value: false, label: 'Private' },
                { value: true, label: 'Public' },
              ].map(opt => (
                <button key={String(opt.value)} onClick={() => setIsPublic(opt.value)}
                  className="flex-1 py-2 font-title text-xs tracking-widest uppercase transition-all duration-150"
                  style={{
                    background: isPublic === opt.value ? '#7a0000' : 'transparent',
                    border: `1px solid ${isPublic === opt.value ? '#c0392b' : '#4a4455'}`,
                    color: isPublic === opt.value ? '#f0e8d5' : '#6e6880',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {isPublic && (
              <p className="text-ghost text-[10px] tracking-wide mt-1.5">
                Other warriors can find and follow this routine.
              </p>
            )}
          </div>

          {error && (
            <p className="text-ember text-xs tracking-wide border border-blood/50 bg-rust/30 px-4 py-2">{error}</p>
          )}

          <button className="btn-primary" onClick={handleSubmit}
            disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Forging...' : 'Forge Routine'}
          </button>

          <button onClick={() => router.push('/routines')}
            className="font-title text-xs tracking-widest uppercase text-ghost hover:text-ash transition-colors text-center">
            ← Back to War Codex
          </button>
        </div>

        {/* ── Días — 3 cols ── */}
        <div className="col-span-3">
          <div className="section-label mb-4">
            Program Structure — {daysPerWeek} days
          </div>

          <div className="flex flex-col gap-3">
            {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map(day => (
              <div key={day} style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>

                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid #1a181e' }}>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-crimson text-sm">Day {day}</span>
                    <span className="text-ghost text-[10px] tracking-wide">
                      {(dayExercises[day] ?? []).length} exercises
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveDayPicker(activeDayPicker === day ? null : day)}
                    className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
                    style={{
                      background: activeDayPicker === day ? '#2e1a1a' : 'transparent',
                      border: `1px solid ${activeDayPicker === day ? '#c0392b' : '#4a4455'}`,
                      color: activeDayPicker === day ? '#e74c3c' : '#6e6880',
                    }}>
                    {activeDayPicker === day ? '✕ Close' : '+ Add'}
                  </button>
                </div>

                {/* Ejercicios del día */}
                {(dayExercises[day] ?? []).length > 0 && (
                  <div className="flex flex-col">
                    {(dayExercises[day] ?? []).map((ex, idx) => (
                      <div key={idx}
                        className="flex items-center gap-3 px-4 py-2.5 group"
                        style={{ borderBottom: '1px solid #1a181e' }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-title text-sm text-bone font-semibold truncate">{ex.exercise.name}</p>
                          <p className="text-ghost text-[10px] tracking-wide uppercase">{ex.exercise.muscle_group}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              className="input-dark w-10 px-1.5 py-1 text-center text-xs"
                              type="number" min="1" max="10"
                              value={ex.target_sets}
                              onChange={e => updateDayExercise(day, idx, 'target_sets', parseInt(e.target.value) || 3)}
                            />
                            <span className="text-ghost text-[10px] font-title">sets</span>
                          </div>
                          <span className="text-ghost text-[10px]">×</span>
                          <div className="flex items-center gap-1">
                            <input
                              className="input-dark w-10 px-1.5 py-1 text-center text-xs"
                              type="number" min="1" max="100"
                              placeholder="—"
                              value={ex.target_reps ?? ''}
                              onChange={e => updateDayExercise(day, idx, 'target_reps', parseInt(e.target.value) || null)}
                            />
                            <span className="text-ghost text-[10px] font-title">reps</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeExerciseFromDay(day, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-ghost hover:text-ember text-xs w-5 h-5 flex items-center justify-center">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Picker inline */}
                {activeDayPicker === day && (
                  <div style={{ borderTop: (dayExercises[day] ?? []).length > 0 ? '1px solid #1a181e' : 'none' }}>
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
                    <div className="p-2 border-b border-iron">
                      <input className="input-dark w-full px-3 py-1.5 text-xs"
                        placeholder="Search exercises..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredExercises(day).length === 0 ? (
                        <p className="text-ghost text-xs p-3 tracking-wide">No exercises found</p>
                      ) : (
                        filteredExercises(day).map(ex => (
                          <button key={ex.id} onClick={() => addExerciseToDay(day, ex)}
                            className="w-full text-left px-3 py-2 transition-all duration-150 border-b border-iron/30"
                            style={{ background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <p className="font-title text-sm text-bone">{ex.name}</p>
                            <p className="text-ghost text-[10px] uppercase tracking-wide">
                              {ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ''}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}