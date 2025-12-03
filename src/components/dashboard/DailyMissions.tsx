'use client'

import { useState } from 'react'
import { Flame, Gift, CheckCircle2, Circle, Zap, Gamepad2, Users, Star, ChevronRight, Sparkles } from 'lucide-react'

interface Mission {
  id: string
  title: string
  description: string
  xp: number
  icon: React.ElementType
  completed: boolean
  progress?: { current: number; total: number }
}

// Mock missions - will be dynamic later
const MOCK_MISSIONS: Mission[] = [
  { 
    id: '1', 
    title: 'Join a Hub', 
    description: 'Visit any game hub', 
    xp: 25, 
    icon: Gamepad2, 
    completed: true 
  },
  { 
    id: '2', 
    title: 'Play 1 Challenge', 
    description: 'Complete a quiz challenge', 
    xp: 50, 
    icon: Zap, 
    completed: false,
    progress: { current: 0, total: 1 }
  },
  { 
    id: '3', 
    title: 'Claim Daily Reward', 
    description: 'Collect your daily bonus', 
    xp: 15, 
    icon: Gift, 
    completed: false 
  },
]

// Mock user XP data
const MOCK_USER = {
  level: 7,
  currentXP: 340,
  nextLevelXP: 500,
  streak: 5,
}

export function DailyMissions() {
  const [missions, setMissions] = useState(MOCK_MISSIONS)
  const [user] = useState(MOCK_USER)
  const [claimingReward, setClaimingReward] = useState(false)

  const completedCount = missions.filter(m => m.completed).length
  const totalXP = missions.reduce((acc, m) => acc + (m.completed ? m.xp : 0), 0)
  const progressPercent = (user.currentXP / user.nextLevelXP) * 100

  const handleClaimDaily = () => {
    setClaimingReward(true)
    setTimeout(() => {
      setMissions(prev => prev.map(m => 
        m.id === '3' ? { ...m, completed: true } : m
      ))
      setClaimingReward(false)
    }, 800)
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-ggza-black-lighter to-ggza-black-light border border-white/5 overflow-hidden">
      {/* Header with Level & Streak */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ggza-gold to-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 text-ggza-black" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Level {user.level}</div>
              <div className="text-[10px] text-gray-500">{user.currentXP} / {user.nextLevelXP} XP</div>
            </div>
          </div>
          
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{user.streak}</span>
            <span className="text-[10px] text-orange-400/70">day streak</span>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-ggza-gold to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Daily Missions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Daily Missions</div>
          <div className="text-[10px] text-ggza-gold font-medium">
            {completedCount}/{missions.length} Done • +{totalXP} XP
          </div>
        </div>

        <div className="space-y-2">
          {missions.map((mission) => {
            const Icon = mission.icon
            const isClaimable = mission.id === '3' && !mission.completed
            
            return (
              <div 
                key={mission.id}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl transition-all
                  ${mission.completed 
                    ? 'bg-green-500/5 border border-green-500/20' 
                    : 'bg-white/5 border border-white/5 hover:border-white/10'}
                `}
              >
                {/* Icon */}
                <div 
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${mission.completed ? 'bg-green-500/20' : 'bg-white/5'}
                  `}
                >
                  {mission.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${mission.completed ? 'text-green-400' : 'text-white'}`}>
                    {mission.title}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{mission.description}</div>
                </div>

                {/* XP Badge or Action */}
                {isClaimable ? (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claimingReward}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold
                      bg-gradient-to-r from-ggza-gold to-amber-500 text-ggza-black
                      hover:from-amber-400 hover:to-ggza-gold transition-all
                      ${claimingReward ? 'animate-pulse' : 'hover:scale-105'}
                    `}
                  >
                    {claimingReward ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        Claim
                      </>
                    )}
                  </button>
                ) : (
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold
                    ${mission.completed ? 'bg-green-500/10 text-green-400' : 'bg-ggza-gold/10 text-ggza-gold'}
                  `}>
                    <Zap className="w-3 h-3" />
                    +{mission.xp}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer - View All */}
      <div className="px-4 py-2 border-t border-white/5">
        <button className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-ggza-gold transition-colors py-1">
          View All Missions
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default DailyMissions

