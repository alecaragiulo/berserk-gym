import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getExercises } from '@/lib/queries/profile'
import { getMyRoutinesWithExercises } from '@/lib/queries/routines'
import Sidebar from '@/components/layout/Sidebar'
import EditRoutineForm from '@/components/routines/EditRoutineForm'

interface Props {
  params: { id: string }
}

export default async function EditRoutinePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routineId = parseInt(params.id)

  const [profile, exercises, myRoutines] = await Promise.all([
    getProfile(user.id),
    getExercises(),
    getMyRoutinesWithExercises(),
  ])

  const routine = myRoutines.find(r => r.id === routineId)
  if (!routine) redirect('/routines')

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <EditRoutineForm routine={routine} exercises={exercises} userId={user.id} />
      </main>
    </div>
  )
}