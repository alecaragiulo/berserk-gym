import { createClient } from '@/lib/supabase/client'

interface RoutineExerciseInput {
  exercise_id: number
  day_number: number
  position: number
  target_sets: number
  target_reps: number | null
  notes: string | null
}

interface CreateRoutineInput {
  name: string
  description: string
  days_per_week: number
  is_public: boolean
  tags: string[]
  exercises: RoutineExerciseInput[]
}

export async function createRoutine(
  userId: string,
  input: CreateRoutineInput
): Promise<number | null> {
  const supabase = createClient()

  // 1. Crear la rutina
  const { data, error } = await (supabase as any)
    .from('routines')
    .insert({
      author_id: userId,
      name: input.name,
      description: input.description || null,
      days_per_week: input.days_per_week,
      is_public: input.is_public,
      tags: input.tags,
    })
    .select('id')
    .single()

  if (error || !data) return null
  const routineId = data.id as number

  // 2. Insertar ejercicios si hay
  if (input.exercises.length > 0) {
    await (supabase as any)
      .from('routine_exercises')
      .insert(input.exercises.map(ex => ({ ...ex, routine_id: routineId })))
  }

  return routineId
}

export async function deleteRoutine(routineId: number): Promise<boolean> {
  const supabase = createClient()
  const { error } = await (supabase as any)
    .from('routines')
    .delete()
    .eq('id', routineId)
  return !error
}

export async function subscribeToRoutine(userId: string, routineId: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('routine_subscriptions')
      .insert({ user_id: userId, routine_id: routineId })
    return !error
  }
  
  export async function unsubscribeFromRoutine(userId: string, routineId: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('routine_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('routine_id', routineId)
    return !error
  }