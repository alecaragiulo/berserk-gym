import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getExercises } from '@/lib/queries/profile'
import Sidebar from '@/components/layout/Sidebar'
import WorkoutTracker from '@/components/workout/WorkoutTracker'
import { getMyRoutinesWithExercises } from '@/lib/queries/routines'
import { getLastSetsForExercises } from '@/lib/queries/sessions'

interface Props {
  searchParams: { routineId?: string; day?: string }
}

export default async function WorkoutPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routineId = searchParams.routineId ? parseInt(searchParams.routineId) : null
  const day = searchParams.day ? parseInt(searchParams.day) : null

  const [profile, exercises, myRoutines] = await Promise.all([
    getProfile(user.id),
    getExercises(),
    routineId ? getMyRoutinesWithExercises() : Promise.resolve([]),
  ])

  const routine = myRoutines.find(r => r.id === routineId) ?? null
  const routineExercisesForDay = routine && day
    ? routine.routine_exercises
        .filter(re => re.day_number === day)
        .sort((a, b) => a.position - b.position)
    : []

  const exerciseIds = routineExercisesForDay.map(re => re.exercise_id)
  const lastSets = await getLastSetsForExercises(user.id, exerciseIds)

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <WorkoutTracker
          exercises={exercises}
          userId={user.id}
          routineId={routineId}
          routineName={routine?.name ?? null}
          routineDay={day}
          preloadedExercises={routineExercisesForDay}
          lastSets={lastSets}
        />
      </main>
    </div>
  )
}