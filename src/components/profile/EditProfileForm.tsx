'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, uploadAvatar } from '@/lib/mutations/profile'

interface Props {
  profile: any
  userId: string
}

export default function EditProfileForm({ profile, userId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(profile?.username ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!username.trim()) { setError('Username is required'); return }
    setSaving(true)
    setError(null)
    setSuccess(false)

    let finalAvatarUrl = avatarUrl

    if (avatarFile) {
      const uploaded = await uploadAvatar(userId, avatarFile)
      if (!uploaded) { setError('Failed to upload avatar'); setSaving(false); return }
      finalAvatarUrl = uploaded
    }

    const ok = await updateProfile(userId, {
      username: username.trim(),
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: finalAvatarUrl || null,
    })

    if (!ok) { setError('Failed to save profile'); setSaving(false); return }

    setSuccess(true)
    setSaving(false)
    router.refresh()
  }

  const currentAvatar = avatarPreview || avatarUrl
  const initials = (username || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-lg">

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-ghost/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7a0000, transparent 60%)' }} />
        <p className="font-title text-blood text-xs tracking-[0.4em] uppercase mb-1">Iron Berserk</p>
        <h1 className="font-title text-3xl font-bold text-bone tracking-wide">
          Edit <span className="text-crimson">Profile</span>
        </h1>
      </header>

      <div className="flex flex-col gap-6">

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 flex items-center justify-center flex-shrink-0 cursor-pointer relative overflow-hidden group"
            style={{ border: '2px solid #4a4455', background: '#1a181e' }}
            onClick={() => fileRef.current?.click()}>
            {currentAvatar ? (
              <img src={currentAvatar} alt="avatar"
                className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-ghost">{initials}</span>
            )}
            {/* Overlay hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <span className="font-title text-[10px] tracking-widest uppercase text-bone">Change</span>
            </div>
          </div>
          <div>
            <p className="font-title text-xs tracking-widest uppercase text-bone mb-1">Profile Photo</p>
            <p className="text-ghost text-[10px] tracking-wide mb-2">JPG or PNG, max 2MB</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
              style={{ border: '1px solid #4a4455', color: '#6e6880' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#f0e8d5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
              Upload Photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={handleAvatarChange} />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Username *
            </label>
            <input
              className="input-dark w-full px-4 py-3 text-sm"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              placeholder="your_username"
            />
            <p className="text-ghost text-[10px] tracking-wide mt-1">
              berserk-gym.vercel.app/profile/{username || '...'}
            </p>
          </div>

          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Display Name
            </label>
            <input
              className="input-dark w-full px-4 py-3 text-sm"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How you appear to others"
            />
          </div>

          <div>
            <label className="font-title text-[10px] tracking-widest uppercase text-ghost block mb-1.5">
              Bio
            </label>
            <textarea
              className="input-dark w-full px-4 py-3 text-sm resize-none"
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell the void who you are..."
              maxLength={160}
            />
            <p className="text-ghost text-[10px] tracking-wide mt-1 text-right">
              {bio.length}/160
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <p className="font-title text-xs tracking-wide px-4 py-3"
            style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
            {error}
          </p>
        )}
        {success && (
          <p className="font-title text-xs tracking-wide px-4 py-3"
            style={{ background: '#0e2a1a', border: '1px solid #1a5c3a', color: '#4caf7d' }}>
            Profile updated successfully
          </p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full"
          style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}