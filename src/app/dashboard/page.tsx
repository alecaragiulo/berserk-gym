import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getDashboardStats } from '@/lib/queries/sessions'
import Sidebar from '@/components/layout/Sidebar'
import DashboardCharts from '@/components/layout/DashboardCharts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, stats] = await Promise.all([
    getProfile(user.id),
    getDashboardStats(user.id),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <DashboardCharts
          username={profile?.username ?? ''}
          stats={stats}
        />
      </main>
    </div>
  )
}