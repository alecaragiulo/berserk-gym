import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getSessionsByMonth } from '@/lib/queries/sessions'
import Sidebar from '@/components/layout/Sidebar'
import SessionCalendar from '@/components/history/SessionCalendar'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const [profile, sessions] = await Promise.all([
    getProfile(user.id),
    getSessionsByMonth(user.id, now.getFullYear(), now.getMonth() + 1),
  ])

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar username={profile?.username ?? ''} streak={profile?.streak ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <SessionCalendar
          sessions={sessions}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth() + 1}
          userId={user.id}
        />
      </main>
    </div>
  )
}