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
  sessionId: number | null
  sessionName: string
  activeExercises: ActiveExercise[]
  currentExerciseIdx: number
  startedAt: Date | null

  // Timer
  timerSeconds: number
  timerActive: boolean
  timerDefault: number
  startTimer: (seconds?: number) => void
  stopTimer: () => void
  tickTimer: () => void
  setTimerDefault: (seconds: number) => void

  // Acciones
  startSession: (sessionId: number, name: string) => void
  addExercise: (exercise: Exercise, targetSets: number) => void
  removeExercise: (idx: number) => void
  setCurrentExercise: (idx: number) => void
  updateSet: (exerciseIdx: number, setIdx: number, field: 'weightKg' | 'reps', value: string) => void
  toggleSetComplete: (exerciseIdx: number, setIdx: number) => void
  addSet: (exerciseIdx: number) => void
  removeSet: (exerciseIdx: number) => void
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

  // Timer
  timerSeconds: 0,
  timerActive: false,
  timerDefault: 90,

  startTimer: (seconds) => set(state => ({
    timerSeconds: seconds ?? state.timerDefault,
    timerActive: true,
  })),

  stopTimer: () => set({ timerActive: false, timerSeconds: 0 }),

  tickTimer: () => set(state => {
    if (state.timerSeconds <= 1) return { timerActive: false, timerSeconds: 0 }
    return { timerSeconds: state.timerSeconds - 1 }
  }),

  setTimerDefault: (seconds) => set({ timerDefault: seconds }),

  // Sesión
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
        return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
      }),
    })),

  toggleSetComplete: (exerciseIdx, setIdx) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) => {
        if (i !== exerciseIdx) return ex
        return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, completed: !s.completed } : s) }
      }),
    })),

  addSet: (exerciseIdx) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) =>
        i === exerciseIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex
      ),
    })),

  removeSet: (exerciseIdx) =>
    set(state => ({
      activeExercises: state.activeExercises.map((ex, i) => {
        if (i !== exerciseIdx || ex.sets.length <= 1) return ex
        return { ...ex, sets: ex.sets.slice(0, -1) }
      }),
    })),

  resetSession: () =>
    set({
      sessionId: null,
      sessionName: '',
      activeExercises: [],
      currentExerciseIdx: 0,
      startedAt: null,
      timerActive: false,
      timerSeconds: 0,
    }),

  getTotalSets: () => get().activeExercises.reduce((a, ex) => a + ex.sets.length, 0),
  getDoneSets: () => get().activeExercises.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0),
  getProgress: () => {
    const total = get().getTotalSets()
    return total === 0 ? 0 : Math.round((get().getDoneSets() / total) * 100)
  },
}))