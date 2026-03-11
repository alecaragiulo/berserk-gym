import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import Sidebar from '@/components/layout/Sidebar'
import EditProfileForm from '@/components/profile/EditProfileForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <EditProfileForm profile={profile} userId={user.id} />
      </main>
    </div>
  )
}