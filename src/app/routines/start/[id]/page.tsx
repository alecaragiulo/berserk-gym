import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyRoutinesWithExercises } from '@/lib/queries/routines'
import { getLastSetsForExercises } from '@/lib/queries/sessions'
import { getProfile, getExercises } from '@/lib/queries/profile'
import Sidebar from '@/components/layout/Sidebar'
import StartSubscribedRoutine from '@/components/routines/StartSubscribedRoutine'

interface Props {
  params: { id: string }
}

export default async function StartSubscribedRoutinePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routineId = parseInt(params.id)

  // Traemos los ejercicios de esta rutina específica
  const { data: routine } = await (supabase as any)
    .from('routines')
    .select(`
      *,
      profiles ( username, display_name, avatar_url ),
      routine_exercises (
        *,
        exercises ( * )
      )
    `)
    .eq('id', routineId)
    .single()

  if (!routine) redirect('/routines')

  const days = Array.from(new Set(
    (routine.routine_exercises as any[]).map((re: any) => re.day_number)
  )).sort() as number[]

  const [profile, exercises] = await Promise.all([
    getProfile(user.id),
    getExercises(),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <StartSubscribedRoutine
          routine={routine}
          days={days}
          exercises={exercises}
          userId={user.id}
        />
      </main>
    </div>
  )
}