import Link from 'next/link'
import type { ProfileWithRoutines } from '@/lib/queries/profile'
import type { RoutineWithAuthor } from '@/lib/queries/routines'

interface Props {
  profile: ProfileWithRoutines
  isOwn: boolean
}

export default function ProfileView({ profile, isOwn }: Props) {
  return (
    <div className="p-4 md:p-10 min-h-screen pb-24 md:pb-10">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          Warrior <span className="text-crimson">Profile</span>
        </h1>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ── Info del usuario ── */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 p-6"
            style={{ background: '#0e0d10', border: '1px solid #1a181e', borderTopColor: '#7a0000', borderTopWidth: '2px' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username}
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: '2px solid #7a0000' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-title text-3xl font-bold"
                style={{ background: '#1a181e', border: '2px solid #7a0000', color: '#c0392b' }}>
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <p className="font-title text-lg font-bold text-bone">
                {profile.display_name ?? profile.username}
              </p>
              <p className="text-ghost text-xs tracking-widest">@{profile.username}</p>
            </div>
            {isOwn && (
              <span className="font-title text-[9px] tracking-widest uppercase px-2 py-1"
                style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                Your Profile
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="p-4" style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
              <p className="font-title text-[10px] tracking-widest uppercase text-ghost mb-2">Bio</p>
              <p className="text-ash text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Streak */}
          <div className="p-4 flex items-center justify-between"
            style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
            <p className="font-title text-[10px] tracking-widest uppercase text-ghost">Current Streak</p>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl text-crimson">{profile.streak}</span>
              <span className="font-title text-[10px] tracking-widest uppercase text-ghost">days</span>
            </div>
          </div>

          {/* Rutina activa */}
          {profile.activeRoutine && (
            <div className="p-4" style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>
              <p className="font-title text-[10px] tracking-widest uppercase text-ghost mb-2">Currently Running</p>
              <div className="flex items-center gap-2">
                <span className="text-crimson text-xs">⚔</span>
                <p className="font-title text-sm font-bold text-bone">{profile.activeRoutine.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Rutinas públicas ── */}
        <div className="col-span-2">
          <div className="section-label mb-4">
            Public Routines
            <span className="ml-2 font-title text-[10px] px-1.5 py-0.5"
              style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
              {profile.publicRoutines.length}
            </span>
          </div>

          {profile.publicRoutines.length === 0 ? (
            <div className="flex items-center justify-center py-16"
              style={{ border: '1px dashed #2e1a1a' }}>
              <p className="text-ghost font-title text-xs tracking-widest uppercase">
                No public routines yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {profile.publicRoutines.map((routine: RoutineWithAuthor) => (
                <div key={routine.id}
                  className="p-4 transition-all duration-150"
                  style={{ background: '#0e0d10', border: '1px solid #1a181e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a181e')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0e0d10')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-title text-base font-bold text-bone mb-1">{routine.name}</p>
                      {routine.description && (
                        <p className="text-ghost text-xs leading-relaxed mb-2 line-clamp-2">{routine.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-ghost text-[10px] tracking-wide">{routine.days_per_week}d/week</span>
                        {routine.tags && routine.tags.length > 0 && (
                          <>
                            <span className="text-ghost text-[10px]">·</span>
                            <div className="flex gap-1 flex-wrap">
                              {routine.tags.map((tag: string) => (
                                <span key={tag} className="font-title text-[9px] tracking-widest uppercase px-1.5 py-0.5"
                                  style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-ghost text-[10px] tracking-wide">
                        {routine.subscribers_count.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}