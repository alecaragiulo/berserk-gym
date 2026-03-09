// src/lib/queries/profile.ts
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/types/database'

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