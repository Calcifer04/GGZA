'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, Star, Zap, Gamepad2, Gift, Target, Trophy, Flame, Calendar, 
  Crown, Medal, Award, User, Users, CheckCircle2, Lock, Sparkles,
  ChevronRight, Loader2
} from 'lucide-react'
import { useMissions, useXP } from '@/lib/hooks'
import { useToast } from '@/components/ui'

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

interface MissionsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'daily' | 'weekly' | 'achievements'

export function MissionsModal({ isOpen, onClose }: MissionsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [showXPGain, setShowXPGain] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false })
  const [mounted, setMounted] = useState(false)
  
  const { data: missionsData, loading, claim, refresh } = useMissions()
  const { refresh: refreshXP } = useXP()
  const toast = useToast()

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const tabs: { id: TabType; label: string; count: number }[] = [
    { 
      id: 'daily', 
      label: 'Daily', 
      count: missionsData?.daily?.filter(m => m.completed && !m.claimed).length || 0 
    },
    { 
      id: 'weekly', 
      label: 'Weekly', 
      count: missionsData?.weekly?.filter(m => m.completed && !m.claimed).length || 0 
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      count: missionsData?.achievements?.filter(m => m.completed && !m.claimed).length || 0 
    },
  ]

  const currentMissions = activeTab === 'daily' 
    ? missionsData?.daily 
    : activeTab === 'weekly'
      ? missionsData?.weekly
      : missionsData?.achievements

  const getPeriodKey = () => {
    if (activeTab === 'daily') return missionsData?.periodKeys?.daily || ''
    if (activeTab === 'weekly') return missionsData?.periodKeys?.weekly || ''
    return 'achievement'
  }

  const handleClaim = async (missionId: string, xpReward: number, missionTitle: string) => {
    setClaimingId(missionId)
    const result = await claim(missionId, getPeriodKey())
    if (result?.success) {
      setShowXPGain({ amount: xpReward, visible: true })
      setTimeout(() => setShowXPGain(prev => ({ ...prev, visible: false })), 2000)
      refreshXP()
      
      // Show toast based on mission type
      if (activeTab === 'achievements') {
        toast.achievement(missionTitle, xpReward)
      } else {
        toast.xpGain(xpReward, `Mission: ${missionTitle}`)
      }
    }
    setClaimingId(null)
  }

  const completedCount = currentMissions?.filter(m => m.completed).length || 0
  const totalCount = currentMissions?.length || 0
  const claimableCount = currentMissions?.filter(m => m.completed && !m.claimed).length || 0

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-br from-ggza-black-lighter to-ggza-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* XP Gain Animation */}
        {showXPGain.visible && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="animate-bounce text-3xl font-bold text-ggza-gold flex items-center gap-2 drop-shadow-lg">
              <Sparkles className="w-8 h-8" />
              +{showXPGain.amount} XP
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-ggza-gold/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ggza-gold to-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-ggza-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Missions</h2>
              <p className="text-sm text-gray-400">Complete missions to earn XP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-white/5 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-ggza-gold/20 text-ggza-gold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-ggza-gold text-ggza-black text-xs font-bold animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="px-6 py-3 bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Progress: <span className="text-white font-medium">{completedCount}/{totalCount}</span> completed
            </span>
            {claimableCount > 0 && (
              <span className="flex items-center gap-1 text-ggza-gold">
                <Sparkles className="w-4 h-4" />
                {claimableCount} reward{claimableCount > 1 ? 's' : ''} to claim
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-ggza-gold to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-ggza-gold animate-spin" />
              <span className="text-gray-400">Loading missions...</span>
            </div>
          ) : currentMissions && currentMissions.length > 0 ? (
            <div className="space-y-3">
              {currentMissions.map((mission) => {
                const Icon = MISSION_ICONS[mission.icon] || Star
                const isClaimable = mission.completed && !mission.claimed
                const isClaimingThis = claimingId === mission.id
                const progressPercent = Math.min((mission.progress / mission.requirementValue) * 100, 100)

                return (
                  <div
                    key={mission.id}
                    className={`
                      relative p-4 rounded-xl border transition-all
                      ${mission.claimed 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : isClaimable
                          ? 'bg-ggza-gold/5 border-ggza-gold/30 ring-1 ring-ggza-gold/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div 
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                          ${mission.claimed 
                            ? 'bg-green-500/20' 
                            : isClaimable
                              ? 'bg-ggza-gold/20'
                              : 'bg-white/10'}
                        `}
                      >
                        {mission.claimed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        ) : (
                          <Icon className={`w-6 h-6 ${isClaimable ? 'text-ggza-gold' : 'text-gray-400'}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={`font-semibold ${
                              mission.claimed 
                                ? 'text-green-400' 
                                : isClaimable 
                                  ? 'text-ggza-gold'
                                  : 'text-white'
                            }`}>
                              {mission.title}
                            </h3>
                            <p className="text-sm text-gray-400 mt-0.5">{mission.description}</p>
                          </div>

                          {/* XP Badge or Claim Button */}
                          {isClaimable ? (
                            <button
                              onClick={() => handleClaim(mission.id, mission.xpReward, mission.title)}
                              disabled={isClaimingThis}
                              className={`
                                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold
                                bg-gradient-to-r from-ggza-gold to-amber-500 text-ggza-black
                                hover:from-amber-400 hover:to-ggza-gold transition-all
                                ${isClaimingThis ? 'animate-pulse' : 'hover:scale-105'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              {isClaimingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  Claim +{mission.xpReward}
                                </>
                              )}
                            </button>
                          ) : (
                            <div className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold
                              ${mission.claimed 
                                ? 'bg-green-500/10 text-green-400' 
                                : 'bg-white/5 text-gray-400'}
                            `}>
                              <Zap className="w-4 h-4" />
                              +{mission.xpReward} XP
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {!mission.claimed && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className={mission.completed ? 'text-ggza-gold' : 'text-gray-400'}>
                                {mission.progress} / {mission.requirementValue}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  mission.completed 
                                    ? 'bg-gradient-to-r from-ggza-gold to-amber-500' 
                                    : 'bg-gray-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Claimed timestamp */}
                        {mission.claimed && mission.completedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Completed {new Date(mission.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">No missions available</p>
              <p className="text-sm text-gray-500">Check back later for new missions!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {activeTab === 'daily' && 'Resets daily at midnight'}
              {activeTab === 'weekly' && 'Resets every Monday'}
              {activeTab === 'achievements' && 'One-time achievements'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body)
}

export default MissionsModal

