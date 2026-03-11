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

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { count: totalSessions } = await (supabase as any)
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthSessions } = await (supabase as any)
    .from('workout_sessions')
    .select('total_volume')
    .eq('user_id', user.id)
    .gte('started_at', startOfMonth.toISOString())

  const monthVolume = (monthSessions as { total_volume: number }[] | null)
    ?.reduce((sum, s) => sum + (s.total_volume ?? 0), 0) ?? 0

  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('streak')
    .eq('id', user.id)
    .single()

  const profile = profileData as { streak: number } | null

  return {
    totalSessions: totalSessions ?? 0,
    monthVolumeKg: monthVolume,
    streak: profile?.streak ?? 0,
  }
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