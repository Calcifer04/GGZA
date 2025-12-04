'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Mic, Circle, Crosshair, Swords, Trophy, Crown, Flame, Gamepad2 } from 'lucide-react'
import { useLiveActivity } from '@/lib/hooks'

// Game icon mapping
const GAME_ICONS: Record<string, React.ComponentType<any>> = {
  cs2: Crosshair,
  valorant: Swords,
  fifa: Trophy,
  fortnite: Crown,
  apex: Flame,
}

// Shortened display names
const SHORT_NAMES: Record<string, string> = {
  cs2: 'CS2',
  valorant: 'VAL',
  fifa: 'FIFA',
  fortnite: 'FN',
  apex: 'APEX',
}

export function LivePlayerCount() {
  const { data, loading, isConnected } = useLiveActivity()
  const [pulse, setPulse] = useState(false)
  const [prevTotal, setPrevTotal] = useState(0)

  // Pulse animation when count changes
  useEffect(() => {
    if (data.totalOnline !== prevTotal && prevTotal !== 0) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 500)
      return () => clearTimeout(timer)
    }
    setPrevTotal(data.totalOnline)
  }, [data.totalOnline, prevTotal])

  return (
    <div className="rounded-2xl rounded-tl-none bg-gradient-to-br from-ggza-black-lighter to-ggza-black-light border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-4 h-4 text-green-400" />
            <Circle className={`absolute -top-0.5 -right-0.5 w-2 h-2 fill-green-400 text-green-400 ${pulse ? 'animate-ping' : ''}`} />
          </div>
          <span className="text-sm font-semibold text-white">Live Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
          </span>
          <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            {isConnected ? 'LIVE' : 'SYNC'}
          </span>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="px-4 py-3 flex items-center gap-6 border-b border-white/5">
        {/* Total Online */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold text-white transition-all ${pulse ? 'scale-110 text-green-400' : ''}`}>
              {loading ? '—' : data.totalOnline}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Online Now</div>
          </div>
        </div>

        {/* Voice Channels */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {loading ? '—' : data.inVoice}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">In Voice</div>
          </div>
        </div>
      </div>

      {/* Hub Counts - Compact Row */}
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Hub Activity</div>
        <div className="flex gap-2">
          {loading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, i) => (
              <div 
                key={i}
                className="flex-1 flex flex-col items-center gap-0.5 p-2 rounded-lg bg-white/5 animate-pulse"
              >
                <div className="w-6 h-4 bg-white/10 rounded" />
                <div className="w-8 h-2 bg-white/5 rounded" />
              </div>
            ))
          ) : (
            data.hubs.map((hub) => {
              const Icon = GAME_ICONS[hub.slug] || Gamepad2
              const shortName = SHORT_NAMES[hub.slug] || hub.name
              return (
                <Link 
                  key={hub.slug}
                  href={`/hub/${hub.slug}`}
                  className="flex-1 flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all hover:scale-105 cursor-pointer group"
                  style={{ backgroundColor: `${hub.color}10` }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold group-hover:scale-110 transition-transform" style={{ color: hub.color }}>
                      {hub.count}
                    </span>
                    {hub.count > 0 && (
                      <Circle className="w-1.5 h-1.5 fill-current animate-pulse" style={{ color: hub.color }} />
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 group-hover:text-gray-400 transition-colors">
                    {shortName}
                  </span>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* In Quiz indicator */}
      {data.inQuiz > 0 && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-center gap-2 bg-ggza-gold/5">
          <Gamepad2 className="w-3.5 h-3.5 text-ggza-gold animate-pulse" />
          <span className="text-xs text-ggza-gold font-medium">
            {data.inQuiz} player{data.inQuiz !== 1 ? 's' : ''} in quiz
          </span>
        </div>
      )}
    </div>
  )
}

export default LivePlayerCount
