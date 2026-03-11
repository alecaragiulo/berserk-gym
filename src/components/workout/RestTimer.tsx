'use client'

import { useEffect, useRef, useState } from 'react'
import { useWorkoutStore } from '@/lib/store/workout'

const PRESETS = [60, 90, 120, 180]

export default function RestTimer() {
  const store = useWorkoutStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showPresets, setShowPresets] = useState(false)

  useEffect(() => {
    if (store.timerActive) {
      intervalRef.current = setInterval(() => {
        store.tickTimer()
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)

      // Notificación cuando llega a 0
      if (store.timerSeconds === 0 && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Iron Berserk', { body: 'Rest complete. Next set!' })
      }
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [store.timerActive])

  // Pedir permiso de notificaciones al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const mins = Math.floor(store.timerSeconds / 60)
  const secs = store.timerSeconds % 60
  const progress = store.timerActive
    ? (store.timerSeconds / store.timerDefault) * 100
    : 0

  if (!store.timerActive && store.timerSeconds === 0) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => store.startTimer()}
          className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
          style={{ border: '1px solid #4a4455', color: '#6e6880' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7a0000'; e.currentTarget.style.color = '#e74c3c' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#4a4455'; e.currentTarget.style.color = '#6e6880' }}>
          ▷ Start Rest ({store.timerDefault}s)
        </button>
        <button
          onClick={() => setShowPresets(v => !v)}
          className="font-title text-[10px] tracking-widest uppercase px-2 py-1.5 transition-all duration-150"
          style={{ border: '1px solid #4a4455', color: '#6e6880' }}>
          ⚙
        </button>
        {showPresets && (
          <div className="flex gap-1">
            {PRESETS.map(s => (
              <button key={s}
                onClick={() => { store.setTimerDefault(s); setShowPresets(false) }}
                className="font-title text-[10px] tracking-widest uppercase px-2 py-1.5 transition-all duration-150"
                style={{
                  background: store.timerDefault === s ? '#7a0000' : 'transparent',
                  border: `1px solid ${store.timerDefault === s ? '#c0392b' : '#4a4455'}`,
                  color: store.timerDefault === s ? '#f0e8d5' : '#6e6880',
                }}>
                {s}s
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-4 p-4 relative overflow-hidden"
      style={{ background: '#0e0d10', border: '1px solid #1a181e' }}>

      {/* Progress bar de fondo */}
      <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
        style={{
          width: `${progress}%`,
          background: progress > 33 ? '#7a0000' : '#e74c3c',
          boxShadow: `0 0 8px ${progress > 33 ? '#7a0000' : '#e74c3c'}`,
        }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-title text-[10px] tracking-widest uppercase text-ghost">Rest</span>
          <span className="font-display text-2xl font-bold"
            style={{ color: progress > 33 ? '#f0e8d5' : '#e74c3c' }}>
            {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => store.startTimer()}
            className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
            style={{ border: '1px solid #4a4455', color: '#6e6880' }}>
            ↺ Reset
          </button>
          <button
            onClick={() => store.stopTimer()}
            className="font-title text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all duration-150"
            style={{ background: '#2e1a1a', border: '1px solid #7a0000', color: '#e74c3c' }}>
            ✕ Skip
          </button>
        </div>
      </div>
    </div>
  )
}