// src/lib/mutations/sessions.ts
import { createClient } from '@/lib/supabase/client'

interface SetInsert {
  session_id: number
  exercise_id: number
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
}

export async function createSession(userId: string, routineId?: number): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('workout_sessions')
    .insert({ user_id: userId, total_volume: 0, routine_id: routineId ?? null })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id as number
}

export async function saveSets(sets: SetInsert[]): Promise<void> {
  if (sets.length === 0) return
  const supabase = createClient()
  await (supabase as any).from('workout_sets').insert(sets)
}

export async function closeSession(sessionId: number, totalVolume: number): Promise<void> {
  const supabase = createClient()
  await (supabase as any)
    .from('workout_sessions')
    .update({ finished_at: new Date().toISOString(), total_volume: totalVolume })
    .eq('id', sessionId)
}

export async function createCustomExercise(
  userId: string,
  name: string,
  muscleGroup: string,
  equipment: string | null
): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('exercises')
    .insert({
      name,
      muscle_group: muscleGroup,
      equipment: equipment || null,
      is_custom: true,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id as number
}

