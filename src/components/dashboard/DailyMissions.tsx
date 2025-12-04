'use client'

import { useState } from 'react'
import { 
  Flame, Gift, CheckCircle2, Zap, Gamepad2, Users, Star, 
  ChevronRight, Sparkles, Target, Trophy, Calendar, Crown, 
  Medal, Award, User, Loader2
} from 'lucide-react'
import { useXP, useDailyReward, useMissions } from '@/lib/hooks'
import { useToast } from '@/components/ui'
import { MissionsModal } from './MissionsModal'

// Icon mapping
const MISSION_ICONS: Record<string, React.ComponentType<any>> = {
  star: Star,
  gamepad: Gamepad2,
  zap: Zap,
  gift: Gift,
  target: Target,
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  calendar: Calendar,
  crown: Crown,
  medal: Medal,
  award: Award,
  user: User,
  users: Users,
}

interface LevelProgress {
  current: number
  max: number
  percentage: number
}

export function DailyMissions() {
  const { data: xpData, loading: xpLoading, refresh: refreshXP } = useXP()
  const { status: dailyStatus, claiming: claimingDaily, claim: claimDaily } = useDailyReward()
  const { data: missionsData, loading: missionsLoading, claim: claimMission } = useMissions()
  const toast = useToast()
  
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null)
  const [showXPGain, setShowXPGain] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false })
  const [showMissionsModal, setShowMissionsModal] = useState(false)

  // Calculate level progress
  const levelProgress: LevelProgress = {
    current: xpData ? xpData.xp - xpData.currentLevelXP : 0,
    max: xpData?.nextLevelXP ? xpData.nextLevelXP - xpData.currentLevelXP : 100,
    percentage: xpData?.nextLevelXP 
      ? ((xpData.xp - xpData.currentLevelXP) / (xpData.nextLevelXP - xpData.currentLevelXP)) * 100
      : 100,
  }

  // Daily missions (combine with daily claim status)
  const dailyMissions = missionsData?.daily || []
  
  // Stats
  const completedCount = dailyMissions.filter(m => m.completed).length
  const claimableCount = dailyMissions.filter(m => m.completed && !m.claimed).length
  const totalXP = dailyMissions.reduce((acc, m) => acc + (m.claimed ? m.xpReward : 0), 0)

  const handleClaimDaily = async () => {
    const result = await claimDaily()
    if (result?.success) {
      setShowXPGain({ amount: result.xpGained, visible: true })
      setTimeout(() => setShowXPGain(prev => ({ ...prev, visible: false })), 2000)
      refreshXP()
      
      // Show streak toast
      if (result.newStreak > 1) {
        toast.streakUpdate(result.newStreak)
      } else {
        toast.xpGain(result.xpGained, 'Daily reward claimed!')
      }
    }
  }

  const handleClaimMission = async (missionId: string) => {
    if (!missionsData?.periodKeys) return
    
    setClaimingMissionId(missionId)
    const mission = dailyMissions.find(m => m.id === missionId)
    const result = await claimMission(missionId, missionsData.periodKeys.daily)
    
    if (result?.success && mission) {
      setShowXPGain({ amount: result.xpGained, visible: true })
      setTimeout(() => setShowXPGain(prev => ({ ...prev, visible: false })), 2000)
      refreshXP()
      
      // Show toast
      toast.xpGain(result.xpGained, `Mission: ${mission.title}`)
    }
    setClaimingMissionId(null)
  }

  const isLoading = xpLoading || missionsLoading

  return (
    <div className="rounded-2xl bg-gradient-to-br from-ggza-black-lighter to-ggza-black-light border border-white/5 overflow-hidden relative">
      {/* XP Gain Animation */}
      {showXPGain.visible && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="animate-bounce text-2xl font-bold text-ggza-gold flex items-center gap-1">
            <Sparkles className="w-6 h-6" />
            +{showXPGain.amount} XP
          </div>
        </div>
      )}

      {/* Header with Level & Streak */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${xpData?.levelColor || '#FFD700'}, ${xpData?.levelColor || '#FFD700'}88)` 
              }}
            >
              <Star className="w-4 h-4 text-ggza-black" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {isLoading ? (
                  <span className="inline-block w-16 h-4 bg-white/10 rounded animate-pulse" />
                ) : (
                  <>Level {xpData?.level || 1}</>
                )}
              </div>
              <div className="text-[10px] text-gray-500">
                {isLoading ? (
                  <span className="inline-block w-20 h-3 bg-white/5 rounded animate-pulse" />
                ) : (
                  <>{xpData?.xp || 0} / {xpData?.nextLevelXP || '—'} XP</>
                )}
              </div>
            </div>
          </div>
          
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-orange-400">
              {isLoading ? '—' : xpData?.streakDays || 0}
            </span>
            <span className="text-[10px] text-orange-400/70">day streak</span>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: isLoading ? '0%' : `${Math.min(levelProgress.percentage, 100)}%`,
              background: `linear-gradient(90deg, ${xpData?.levelColor || '#FFD700'}, ${xpData?.levelColor || '#FFD700'}88)`,
            }}
          />
        </div>
        
        {/* Level Title */}
        {xpData?.levelTitle && (
          <div className="mt-2 text-[10px] text-center">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              {xpData.levelTitle}
            </span>
          </div>
        )}
      </div>

      {/* Daily Missions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Daily Missions</div>
          <div className="text-[10px] text-ggza-gold font-medium">
            {completedCount}/{dailyMissions.length} Done • +{totalXP} XP
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-white/10 rounded mb-1" />
                  <div className="w-32 h-2 bg-white/5 rounded" />
                </div>
                <div className="w-12 h-6 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            dailyMissions.map((mission) => {
              const Icon = MISSION_ICONS[mission.icon] || Star
              const isDailyClaimMission = mission.slug === 'daily_claim'
              const canClaimDaily = isDailyClaimMission && dailyStatus?.canClaim
              const isClaimingThis = claimingMissionId === mission.id || (isDailyClaimMission && claimingDaily)
              const canClaim = mission.completed && !mission.claimed && !isDailyClaimMission
              
              return (
                <div 
                  key={mission.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-xl transition-all
                    ${mission.completed && mission.claimed
                      ? 'bg-green-500/5 border border-green-500/20' 
                      : mission.completed
                        ? 'bg-ggza-gold/5 border border-ggza-gold/20'
                        : 'bg-white/5 border border-white/5 hover:border-white/10'}
                  `}
                >
                  {/* Icon */}
                  <div 
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${mission.completed && mission.claimed
                        ? 'bg-green-500/20' 
                        : mission.completed
                          ? 'bg-ggza-gold/20'
                          : 'bg-white/5'}
                    `}
                  >
                    {mission.completed && mission.claimed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Icon className={`w-4 h-4 ${mission.completed ? 'text-ggza-gold' : 'text-gray-400'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      mission.completed && mission.claimed 
                        ? 'text-green-400' 
                        : mission.completed 
                          ? 'text-ggza-gold'
                          : 'text-white'
                    }`}>
                      {mission.title}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {mission.description}
                      {mission.requirementValue > 1 && !mission.completed && (
                        <span className="ml-1 text-gray-400">
                          ({mission.progress}/{mission.requirementValue})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP Badge or Action */}
                  {canClaimDaily ? (
                    <button
                      onClick={handleClaimDaily}
                      disabled={isClaimingThis}
                      className={`
                        flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold
                        bg-gradient-to-r from-ggza-gold to-amber-500 text-ggza-black
                        hover:from-amber-400 hover:to-ggza-gold transition-all
                        ${isClaimingThis ? 'animate-pulse' : 'hover:scale-105'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isClaimingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          Claim
                        </>
                      )}
                    </button>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaimMission(mission.id)}
                      disabled={isClaimingThis}
                      className={`
                        flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold
                        bg-gradient-to-r from-ggza-gold to-amber-500 text-ggza-black
                        hover:from-amber-400 hover:to-ggza-gold transition-all
                        ${isClaimingThis ? 'animate-pulse' : 'hover:scale-105'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isClaimingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          +{mission.xpReward}
                        </>
                      )}
                    </button>
                  ) : (
                    <div className={`
                      flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold
                      ${mission.completed && mission.claimed
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-ggza-gold/10 text-ggza-gold'}
                    `}>
                      <Zap className="w-3 h-3" />
                      +{mission.xpReward}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Claimable indicator */}
        {claimableCount > 0 && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ggza-gold/10 text-ggza-gold text-xs font-medium animate-pulse">
              <Sparkles className="w-3 h-3" />
              {claimableCount} reward{claimableCount > 1 ? 's' : ''} ready to claim!
            </span>
          </div>
        )}
      </div>

      {/* Footer - View All */}
      <div className="px-4 py-2 border-t border-white/5">
        <button 
          onClick={() => setShowMissionsModal(true)}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-ggza-gold transition-colors py-1"
        >
          View All Missions
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Missions Modal */}
      <MissionsModal 
        isOpen={showMissionsModal} 
        onClose={() => setShowMissionsModal(false)} 
      />
    </div>
  )
}

export default DailyMissions
