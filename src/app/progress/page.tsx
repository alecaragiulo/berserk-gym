// src/app/progress/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getRecentSessions } from '@/lib/queries/sessions'
import Sidebar from '@/components/layout/Sidebar'
import ProgressCharts from '@/components/layout/ProgressCharts'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, sessions] = await Promise.all([
    getProfile(user.id),
    getRecentSessions(30),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <ProgressCharts sessions={sessions} />
      </main>
    </div>
  )
}