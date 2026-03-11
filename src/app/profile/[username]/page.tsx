import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getProfileByUsername } from '@/lib/queries/profile'
import Sidebar from '@/components/layout/Sidebar'
import ProfileView from '@/components/profile/ProfileView'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [myProfile, targetProfile] = await Promise.all([
    getProfile(user.id),
    getProfileByUsername(params.username),
  ])

  if (!targetProfile) notFound()

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={myProfile?.username ?? ''} streak={myProfile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <ProfileView profile={targetProfile} isOwn={myProfile?.username === targetProfile.username} />
      </main>
    </div>
  )
}