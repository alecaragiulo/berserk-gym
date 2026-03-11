'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(userId: string, data: {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update(data)
    .eq('id', userId)

  return !error
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = await createClient()

  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) return null

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}