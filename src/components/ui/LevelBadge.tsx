'use client'

import { Star, Zap } from 'lucide-react'
import { useXP } from '@/lib/hooks'

interface LevelBadgeProps {
  level?: number
  xp?: number
  showXP?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Level titles and colors (should match database)
const LEVEL_DATA: Record<number, { title: string; color: string }> = {
  1: { title: 'Rookie', color: '#9CA3AF' },
  2: { title: 'Rookie', color: '#9CA3AF' },
  3: { title: 'Rookie', color: '#9CA3AF' },
  4: { title: 'Apprentice', color: '#60A5FA' },
  5: { title: 'Apprentice', color: '#60A5FA' },
  6: { title: 'Apprentice', color: '#60A5FA' },
  7: { title: 'Competitor', color: '#34D399' },
  8: { title: 'Competitor', color: '#34D399' },
  9: { title: 'Competitor', color: '#34D399' },
  10: { title: 'Expert', color: '#A78BFA' },
  11: { title: 'Expert', color: '#A78BFA' },
  12: { title: 'Expert', color: '#A78BFA' },
  13: { title: 'Master', color: '#F59E0B' },
  14: { title: 'Master', color: '#F59E0B' },
  15: { title: 'Master', color: '#F59E0B' },
  16: { title: 'Grandmaster', color: '#EF4444' },
  17: { title: 'Grandmaster', color: '#EF4444' },
  18: { title: 'Grandmaster', color: '#EF4444' },
  19: { title: 'Legend', color: '#FFD700' },
  20: { title: 'Legend', color: '#FFD700' },
  21: { title: 'Champion', color: '#FF6B6B' },
  22: { title: 'Champion', color: '#FF6B6B' },
  23: { title: 'Champion', color: '#FF6B6B' },
  24: { title: 'Immortal', color: '#00D9FF' },
  25: { title: 'Immortal', color: '#00D9FF' },
}

function getLevelData(level: number) {
  return LEVEL_DATA[level] || LEVEL_DATA[Math.min(25, Math.max(1, level))] || LEVEL_DATA[1]
}

export function LevelBadge({ 
  level: propLevel, 
  xp: propXP, 
  showXP = false, 
  size = 'md',
  className = '' 
}: LevelBadgeProps) {
  // Use hook if no props provided
  const { data } = useXP()
  
  const level = propLevel ?? data?.level ?? 1
  const xp = propXP ?? data?.xp ?? 0
  const levelData = getLevelData(level)

  const sizes = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'px-3 py-1.5 text-base gap-2',
      icon: 'w-5 h-5',
    },
  }

  return (
    <div 
      className={`
        inline-flex items-center rounded-lg font-semibold
        ${sizes[size].container}
        ${className}
      `}
      style={{ 
        backgroundColor: `${levelData.color}20`,
        color: levelData.color,
      }}
    >
      <Star className={sizes[size].icon} />
      <span>Lvl {level}</span>
      {showXP && (
        <>
          <span className="opacity-50">•</span>
          <span className="flex items-center gap-0.5">
            <Zap className={sizes[size].icon} />
            {xp.toLocaleString()}
          </span>
        </>
      )}
    </div>
  )
}

export function LevelProgress({ className = '' }: { className?: string }) {
  const { data, loading } = useXP()

  if (loading || !data) {
    return (
      <div className={`h-1.5 bg-white/5 rounded-full overflow-hidden ${className}`}>
        <div className="h-full w-1/2 bg-white/10 rounded-full animate-pulse" />
      </div>
    )
  }

  const levelData = getLevelData(data.level)
  const progress = data.nextLevelXP 
    ? ((data.xp - data.currentLevelXP) / (data.nextLevelXP - data.currentLevelXP)) * 100
    : 100

  return (
    <div className={`h-1.5 bg-white/5 rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full rounded-full transition-all duration-500"
        style={{ 
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: levelData.color,
        }}
      />
    </div>
  )
}

export default LevelBadge

