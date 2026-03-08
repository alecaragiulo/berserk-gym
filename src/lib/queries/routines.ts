import { createClient } from '@/lib/supabase/server'
import type { RoutineWithAuthor } from '@/types/database'

// Rutinas públicas para el feed
export async function getPublicRoutines(limit = 20, offset = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url )
    `)
    .eq('is_public', true)
    .order('subscribers_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as RoutineWithAuthor[]
}

// Rutinas del usuario actual (propias + suscripciones)
export async function getMyRoutines() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url )
    `)
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as RoutineWithAuthor[]
}

// Rutinas a las que el usuario está suscripto
export async function getSubscribedRoutines() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('routine_subscriptions')
    .select(`
      routine_id,
      routines (
        *,
        profiles ( username, display_name, avatar_url )
      )
    `)
    .eq('user_id', user.id)

  if (error) throw error
  return data.map(d => d.routines) as RoutineWithAuthor[]
}
