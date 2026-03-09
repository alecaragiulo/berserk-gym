import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getExercises } from '@/lib/queries/profile'
import Sidebar from '@/components/layout/Sidebar'
import CreateRoutineForm from '@/components/routines/CreateRoutineForm'

export default async function CreateRoutinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, exercises] = await Promise.all([
    getProfile(user.id),
    getExercises(),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <CreateRoutineForm exercises={exercises} userId={user.id} />
      </main>
    </div>
  )
}