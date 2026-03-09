import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getPublicRoutines, getSubscribedIds, getMyRoutinesWithExercises } from '@/lib/queries/routines'
import Sidebar from '@/components/layout/Sidebar'
import RoutinesFeed from '@/components/routines/RoutinesFeed'

export default async function RoutinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, publicRoutines, subscribedIds, myRoutines] = await Promise.all([
    getProfile(user.id),
    getPublicRoutines(18),
    getSubscribedIds(user.id),
    getMyRoutinesWithExercises(),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <RoutinesFeed
          publicRoutines={publicRoutines}
          myRoutines={myRoutines}
          subscribedIds={subscribedIds}
          userId={user.id}
        />
      </main>
    </div>
  )
}