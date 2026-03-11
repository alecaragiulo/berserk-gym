// src/lib/queries/profile.ts
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/types/database'
import type { RoutineWithAuthor } from '@/lib/queries/routines'


export interface ProfileData {
  username: string
  display_name: string | null
  streak: number
}

export async function getProfile(userId: string): Promise<ProfileData | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name, streak')
    .eq('id', userId)
    .single()
  return data as ProfileData | null
}

export async function getExercises(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_custom', false)
    .order('muscle_group')
    .order('name')
  return (data as Exercise[] | null) ?? []
}

export interface PublicProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  streak: number
}

export interface ProfileWithRoutines extends PublicProfile {
  publicRoutines: RoutineWithAuthor[]
  activeRoutine: { id: number; name: string } | null
}

export async function getProfileByUsername(username: string): Promise<ProfileWithRoutines | null> {
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, streak')
    .eq('username', username)
    .single()

  if (!profile) return null

  const { data: routines } = await (supabase as any)
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url )
    `)
    .eq('author_id', (profile as PublicProfile).id)
    .eq('is_public', true)
    .order('subscribers_count', { ascending: false })

  // Rutina activa = la última sesión no terminada, o la última rutina usada
  const { data: lastSession } = await (supabase as any)
    .from('workout_sessions')
    .select('routine_id, routines ( id, name )')
    .eq('user_id', (profile as PublicProfile).id)
    .not('routine_id', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  const activeRoutine = lastSession?.routines
    ? { id: lastSession.routines.id, name: lastSession.routines.name }
    : null

  return {
    ...(profile as PublicProfile),
    publicRoutines: (routines as RoutineWithAuthor[] | null) ?? [],
    activeRoutine,
  }
}