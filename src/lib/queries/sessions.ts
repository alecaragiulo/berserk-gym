import { createClient } from '@/lib/supabase/server'
import type { SessionWithSets } from '@/types/database'

// Sesiones recientes del usuario
export async function getRecentSessions(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
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

  if (error) throw error
  return data as SessionWithSets[]
}

// Stats del usuario para el dashboard
export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Total de sesiones
  const { count: totalSessions } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)

  // Volumen del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthSessions } = await supabase
    .from('workout_sessions')
    .select('total_volume')
    .eq('user_id', user.id)
    .gte('started_at', startOfMonth.toISOString())

  const monthVolume = monthSessions?.reduce((sum, s) => sum + (s.total_volume ?? 0), 0) ?? 0

  // Streak del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak')
    .eq('id', user.id)
    .single()

  return {
    totalSessions: totalSessions ?? 0,
    monthVolumeKg: monthVolume,
    streak: profile?.streak ?? 0,
  }
}

// Crear sesión nueva
export async function startWorkoutSession(routineId?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
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

// Cerrar sesión y guardar volumen total
export async function finishWorkoutSession(sessionId: number) {
  const supabase = await createClient()

  // Calcular volumen total de todos los sets completados
  const { data: sets } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps')
    .eq('session_id', sessionId)
    .eq('completed', true)

  const totalVolume = sets?.reduce((sum, s) => {
    return sum + ((s.weight_kg ?? 0) * (s.reps ?? 0))
  }, 0) ?? 0

  const { data, error } = await supabase
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
