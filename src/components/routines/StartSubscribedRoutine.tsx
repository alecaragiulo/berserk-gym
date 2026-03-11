'use client'

import { useRouter } from 'next/navigation'

interface Props {
  routine: any
  days: number[]
  exercises: any[]
  userId: string
}

export default function StartSubscribedRoutine({ routine, days, exercises }: Props) {
  const router = useRouter()

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">War Codex</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          {routine.name}
        </h1>
        <p className="text-ghost text-xs tracking-widest uppercase mt-1">
          by {routine.profiles?.username} · {routine.days_per_week}d/week
        </p>
      </header>

      <div className="max-w-lg flex flex-col gap-3">
        <div className="section-label mb-2">Choose a Day</div>
        {days.map((day: number) => {
          const dayExs = (routine.routine_exercises as any[])
            .filter((re: any) => re.day_number === day)
            .sort((a: any, b: any) => a.position - b.position)

          const muscles = Array.from(new Set(
            dayExs.map((re: any) => re.exercises?.muscle_group).filter(Boolean)
          )) as string[]

          return (
            <div key={day}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-150"
              style={{ background: '#0e0d10', border: '1px solid #1a181e' }}
              onClick={() => router.push(`/workout?routineId=${routine.id}&day=${day}`)}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0e0d10')}>

              <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center"
                style={{ border: '1px solid #7a0000', background: '#2e1a1a' }}>
                <p className="font-title text-[9px] tracking-widest uppercase text-ghost">Day</p>
                <p className="font-display text-lg text-crimson leading-none">{day}</p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1 mb-1">
                  {muscles.slice(0, 4).map((mg: string) => (
                    <span key={mg} className="font-title text-[9px] tracking-widest uppercase px-1.5 py-0.5"
                      style={{ background: '#1a181e', border: '1px solid #4a4455', color: '#b0a8bc' }}>
                      {mg}
                    </span>
                  ))}
                </div>
                <p className="text-ghost text-[10px] tracking-wide">
                  {dayExs.length} exercises · {dayExs.reduce((s: number, re: any) => s + re.target_sets, 0)} sets total
                </p>
              </div>

              <span className="font-title text-xs tracking-widest uppercase px-4 py-2.5 flex-shrink-0"
                style={{ background: '#7a0000', border: '1px solid #c0392b', color: '#f0e8d5' }}>
                ⚔ Start
              </span>
            </div>
          )
        })}

        <button onClick={() => router.back()}
          className="font-title text-xs tracking-widest uppercase text-ghost hover:text-ash transition-colors text-center mt-2">
          ← Back
        </button>
      </div>
    </div>
  )
}