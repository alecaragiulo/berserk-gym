import { createClient } from '@/lib/supabase/server'
import type { RoutineWithAuthor } from '@/types/database'
import type { RoutineExercise, Exercise } from '@/types/database'

export type { RoutineWithAuthor } from '@/types/database'

// ── Tipos ────────────────────────────────

interface SubscriptionData {
  routine_id: number
}

interface SubscriptionWithRoutine {
  routine_id: number
  routines: RoutineWithAuthor
}

export interface RoutineWithExercises extends RoutineWithAuthor {
  routine_exercises: (RoutineExercise & { exercises: Exercise })[]
}

// ── Queries ──────────────────────────────

export async function getPublicRoutines(limit = 20, offset = 0): Promise<RoutineWithAuthor[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url )
    `)
    .eq('is_public', true)
    .order('subscribers_count', { ascending: false })
    .range(offset, offset + limit - 1)

  return (data as RoutineWithAuthor[] | null) ?? []
}

export async function getMyRoutines(): Promise<RoutineWithAuthor[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url )
    `)
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  return (data as RoutineWithAuthor[] | null) ?? []
}

export async function getMyRoutinesWithExercises(): Promise<RoutineWithExercises[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url ),
      routine_exercises (
        *,
        exercises ( * )
      )
    `)
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  return (data as RoutineWithExercises[] | null) ?? []
}

export async function getSubscribedIds(userId: string): Promise<number[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('routine_subscriptions')
    .select('routine_id')
    .eq('user_id', userId)

  return (data as SubscriptionData[] | null ?? []).map(s => s.routine_id)
}

export async function getSubscribedRoutines(): Promise<RoutineWithAuthor[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('routine_subscriptions')
    .select(`
      routine_id,
      routines (
        *,
        profiles ( username, display_name, avatar_url )
      )
    `)
    .eq('user_id', user.id)

  return ((data as SubscriptionWithRoutine[] | null) ?? []).map(d => d.routines)
}