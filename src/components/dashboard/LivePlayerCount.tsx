'use client'

import { useState, useEffect } from 'react'
import { Users, Mic, Circle, Gamepad2, Crosshair, Swords, Trophy, Crown, Flame } from 'lucide-react'

// Mock data - will be replaced with Discord API sync
const MOCK_DATA = {
  totalOnline: 247,
  hubs: [
    { name: 'CS2', slug: 'cs2', count: 89, color: '#DE9B35', icon: Crosshair },
    { name: 'VAL', slug: 'valorant', count: 67, color: '#FD4556', icon: Swords },
    { name: 'FIFA', slug: 'fifa', count: 43, color: '#22C55E', icon: Trophy },
    { name: 'FN', slug: 'fortnite', count: 31, color: '#9D4DFF', icon: Crown },
    { name: 'APEX', slug: 'apex', count: 17, color: '#DA292A', icon: Flame },
  ],
  voiceChannels: 4,
  inVoice: 23,
}

export function LivePlayerCount() {
  const [data, setData] = useState(MOCK_DATA)
  const [pulse, setPulse] = useState(false)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 500)
      
      // Randomly fluctuate numbers slightly for "live" feel
      setData(prev => ({
        ...prev,
        totalOnline: prev.totalOnline + Math.floor(Math.random() * 5) - 2,
        inVoice: Math.max(0, prev.inVoice + Math.floor(Math.random() * 3) - 1),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
          </span>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
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
            <div className="text-2xl font-bold text-white">{data.totalOnline}</div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Online Now</div>
          </div>
        </div>

        {/* Voice Channels */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.inVoice}</div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">In Voice</div>
          </div>
        </div>
      </div>

      {/* Hub Counts - Compact Row */}
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Hub Activity</div>
        <div className="flex gap-2">
          {data.hubs.map((hub) => (
            <div 
              key={hub.slug}
              className="flex-1 flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: `${hub.color}10` }}
            >
              <span className="text-sm font-bold" style={{ color: hub.color }}>{hub.count}</span>
              <span className="text-[9px] text-gray-500">{hub.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LivePlayerCount

