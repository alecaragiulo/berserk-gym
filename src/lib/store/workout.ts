import { create } from 'zustand'
import type { Exercise } from '@/types/database'

// ── Tipos del store ──────────────────────
interface SetLog {
  weightKg: string
  reps: string
  completed: boolean
}

interface ActiveExercise {
  exercise: Exercise
  sets: SetLog[]
}

interface WorkoutStore {
  // Estado de la sesión activa
  sessionId: number | null
  sessionName: string
  activeExercises: ActiveExercise[]
  currentExerciseIdx: number
  startedAt: Date | null

  // Acciones
  startSession: (sessionId: number, name: string) => void
  addExercise: (exercise: Exercise, targetSets: number) => void
  removeExercise: (idx: number) => void
  setCurrentExercise: (idx: number) => void
  updateSet: (exerciseIdx: number, setIdx: number, field: 'weightKg' | 'reps', value: string) => void
  toggleSetComplete: (exerciseIdx: number, setIdx: number) => void
  addSet: (exerciseIdx: number) => void
  resetSession: () => void

  // Computed
  getTotalSets: () => number
  getDoneSets: () => number
  getProgress: () => number
}

const emptySet = (): SetLog => ({ weightKg: '', reps: '', completed: false })

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  sessionId: null,
  sessionName: '',
  activeExercises: [],
  currentExerciseIdx: 0,
  startedAt: null,

  startSession: (sessionId, name) =>
    set({ sessionId, sessionName: name, startedAt: new Date(), activeExercises: [] }),

  addExercise: (exercise, targetSets) =>
    set(state => ({
      activeExercises: [
        ...state.activeExercises,
        { exercise, sets: Array.from({ length: targetSets }, emptySet) },
      ],
    })),

  removeExercise: (idx) =>
    set(state => ({
      activeExercises: state.activeExercises.filter((_, i) => i !== idx),
      currentExerciseIdx: Math.min(state.currentExerciseIdx, state.activeExercises.length - 2),
    })),

  setCurrentExercise: (idx) => set({ currentExerciseIdx: idx }),

  updateSet: (exerciseIdx, setIdx, field, value) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) => {
        if (i !== exerciseIdx) return ex
        const newSets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s
        )
        return { ...ex, sets: newSets }
      }),
    })),

  toggleSetComplete: (exerciseIdx, setIdx) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) => {
        if (i !== exerciseIdx) return ex
        const newSets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, completed: !s.completed } : s
        )
        return { ...ex, sets: newSets }
      }),
    })),

  addSet: (exerciseIdx) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) =>
        i === exerciseIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex
      ),
    })),

  resetSession: () =>
    set({ sessionId: null, sessionName: '', activeExercises: [], currentExerciseIdx: 0, startedAt: null }),

  getTotalSets: () => get().activeExercises.reduce((a, ex) => a + ex.sets.length, 0),
  getDoneSets:  () => get().activeExercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0),
  getProgress:  () => {
    const total = get().getTotalSets()
    return total === 0 ? 0 : Math.round((get().getDoneSets() / total) * 100)
  },
}))
