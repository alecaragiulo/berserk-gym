import { createClient } from '@/lib/supabase/server'
import type { SessionWithSets } from '@/types/database'

export async function getRecentSessions(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('workout_sessions')
    .select(`
      *,
      workout_sets (
        *,
        exercises ( name, muscle_group )
      )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit)

  return (data as SessionWithSets[] | null) ?? []
}


export async function startWorkoutSession(routineId?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase as any)
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      routine_id: routineId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function finishWorkoutSession(sessionId: number) {
  const supabase = await createClient()

  const { data: sets } = await (supabase as any)
    .from('workout_sets')
    .select('weight_kg, reps')
    .eq('session_id', sessionId)
    .eq('completed', true)

  const totalVolume = (sets as { weight_kg: number | null; reps: number | null }[] | null)
    ?.reduce((sum, s) => sum + ((s.weight_kg ?? 0) * (s.reps ?? 0)), 0) ?? 0

  const { data, error } = await (supabase as any)
    .from('workout_sessions')
    .update({
      finished_at: new Date().toISOString(),
      total_volume: totalVolume,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLastSetsForExercises(
  userId: string,
  exerciseIds: number[]
): Promise<Record<number, { weight_kg: number | null; reps: number | null }[]>> {
  if (exerciseIds.length === 0) return {}
  const supabase = await createClient()

  // Para cada ejercicio traemos los sets de la última sesión donde apareció
  const result: Record<number, { weight_kg: number | null; reps: number | null }[]> = {}

  await Promise.all(exerciseIds.map(async (exerciseId) => {
    const { data } = await (supabase as any)
      .from('workout_sets')
      .select('weight_kg, reps, set_number, workout_sessions!inner(user_id, started_at)')
      .eq('exercise_id', exerciseId)
      .eq('workout_sessions.user_id', userId)
      .eq('completed', true)
      .order('workout_sessions(started_at)', { ascending: false })
      .limit(10)

    if (!data || data.length === 0) return

    // Agrupar por sesión — tomamos solo la más reciente
    const sets = (data as any[])
      .sort((a, b) => a.set_number - b.set_number)
      .map(s => ({ weight_kg: s.weight_kg, reps: s.reps }))

    result[exerciseId] = sets
  }))

  return result
}

export interface SetDetail {
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
}

export interface ExerciseWithSets {
  exercise_id: number
  exercise_name: string
  muscle_group: string
  sets: SetDetail[]
}

export interface SessionDetail {
  id: number
  started_at: string
  finished_at: string | null
  total_volume: number
  routine_name: string | null
  exercises: ExerciseWithSets[]
}

export async function getSessionsByMonth(userId: string, year: number, month: number): Promise<SessionDetail[]> {
  const supabase = await createClient()

  const from = new Date(year, month - 1, 1).toISOString()
  const to = new Date(year, month, 1).toISOString()

  const { data } = await (supabase as any)
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      finished_at,
      total_volume,
      routines ( name ),
      workout_sets (
        set_number,
        weight_kg,
        reps,
        completed,
        exercises ( id, name, muscle_group )
      )
    `)
    .eq('user_id', userId)
    .gte('started_at', from)
    .lt('started_at', to)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })

  if (!data) return []

  return (data as any[]).map(session => {
    // Agrupar sets por ejercicio
    const exerciseMap: Record<number, ExerciseWithSets> = {}
    for (const set of session.workout_sets ?? []) {
      const ex = set.exercises
      if (!ex) continue
      if (!exerciseMap[ex.id]) {
        exerciseMap[ex.id] = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          muscle_group: ex.muscle_group,
          sets: [],
        }
      }
      exerciseMap[ex.id].sets.push({
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        completed: set.completed,
      })
    }

    return {
      id: session.id,
      started_at: session.started_at,
      finished_at: session.finished_at,
      total_volume: session.total_volume ?? 0,
      routine_name: session.routines?.name ?? null,
      exercises: Object.values(exerciseMap).map(ex => ({
        ...ex,
        sets: ex.sets.sort((a, b) => a.set_number - b.set_number),
      })),
    }
  })
}

export interface ExercisePR {
  exercise_id: number
  best_weight: number
  best_reps: number
  best_volume: number // weight × reps — el verdadero PR
}

export async function getPRsForExercises(
  userId: string,
  exerciseIds: number[]
): Promise<Record<number, ExercisePR>> {
  if (exerciseIds.length === 0) return {}
  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('workout_sets')
    .select(`
      exercise_id,
      weight_kg,
      reps,
      workout_sessions!inner ( user_id )
    `)
    .eq('workout_sessions.user_id', userId)
    .in('exercise_id', exerciseIds)
    .eq('completed', true)
    .not('weight_kg', 'is', null)
    .not('reps', 'is', null)

  if (!data) return {}

  const map: Record<number, ExercisePR> = {}
  for (const row of data as any[]) {
    const id = row.exercise_id
    const vol = (row.weight_kg ?? 0) * (row.reps ?? 0)
    if (!map[id] || vol > map[id].best_volume) {
      map[id] = {
        exercise_id: id,
        best_weight: row.weight_kg,
        best_reps: row.reps,
        best_volume: vol,
      }
    }
  }

  return map
}

export interface WeeklyVolume {
  week: string
  volume: number
  sessions: number
}

export interface MuscleFrequency {
  muscle_group: string
  sets: number
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sessions } = await (supabase as any)
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      finished_at,
      total_volume,
      workout_sets (
        completed,
        weight_kg,
        reps,
        exercises ( muscle_group )
      )
    `)
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: true })

  if (!sessions) return { weeklyVolume: [], muscleFrequency: [], totalSessions: 0, totalVolume: 0, avgDuration: 0 }

  // Volumen por semana
  const weekMap: Record<string, { volume: number; sessions: number }> = {}
  for (const s of sessions as any[]) {
    const d = new Date(s.started_at)
    // Lunes de esa semana
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    if (!weekMap[key]) weekMap[key] = { volume: 0, sessions: 0 }
    weekMap[key].volume += s.total_volume ?? 0
    weekMap[key].sessions += 1
  }

  const weeklyVolume: WeeklyVolume[] = Object.entries(weekMap).map(([week, data]) => ({
    week,
    volume: Math.round(data.volume),
    sessions: data.sessions,
  }))

  // Frecuencia por músculo
  const muscleMap: Record<string, number> = {}
  for (const s of sessions as any[]) {
    for (const ws of s.workout_sets ?? []) {
      if (!ws.completed) continue
      const mg = ws.exercises?.muscle_group
      if (mg) muscleMap[mg] = (muscleMap[mg] ?? 0) + 1
    }
  }

  const muscleFrequency: MuscleFrequency[] = Object.entries(muscleMap)
    .map(([muscle_group, sets]) => ({ muscle_group, sets }))
    .sort((a, b) => b.sets - a.sets)

  // Stats globales
  const totalVolume = (sessions as any[]).reduce((s, se) => s + (se.total_volume ?? 0), 0)
  const durations = (sessions as any[])
    .filter(s => s.finished_at)
    .map(s => new Date(s.finished_at).getTime() - new Date(s.started_at).getTime())
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000)
    : 0

  return {
    weeklyVolume,
    muscleFrequency,
    totalSessions: (sessions as any[]).length,
    totalVolume: Math.round(totalVolume),
    avgDuration,
  }
}