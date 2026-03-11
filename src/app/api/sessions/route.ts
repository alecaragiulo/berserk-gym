import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionsByMonth } from '@/lib/queries/sessions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const year = parseInt(searchParams.get('year') ?? '0')
  const month = parseInt(searchParams.get('month') ?? '0')

  if (!userId || !year || !month) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return NextResponse.json([])

  const sessions = await getSessionsByMonth(userId, year, month)
  return NextResponse.json(sessions)
}