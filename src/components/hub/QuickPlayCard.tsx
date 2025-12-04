'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, Calendar, Zap, CheckCircle, Flame, Play, Clock } from 'lucide-react'
import { Card, Button, Badge, Countdown } from '@/components/ui'
import { cn } from '@/lib/utils'

interface QuickPlayCardProps {
  gameSlug: string
  gameName: string
  gameColor: string
}

interface PlayStatus {
  daily: { completed: boolean; streak?: number }
  flash: { completed: boolean; nextAt?: string }
}

export function QuickPlayCard({ gameSlug, gameName, gameColor }: QuickPlayCardProps) {
  const [status, setStatus] = useState<PlayStatus>({
    daily: { completed: false },
    flash: { completed: false },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/daily-challenge?game=${gameSlug}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/flash-quiz?game=${gameSlug}`).then(r => r.json()).catch(() => ({})),
    ]).then(([daily, flash]) => {
      setStatus({
        daily: { 
          completed: daily.status === 'completed',
          streak: daily.streak?.current || 0,
        },
        flash: { 
          completed: flash.status === 'completed',
          nextAt: flash.nextFlashAt,
        },
      })
      setLoading(false)
    })
  }, [gameSlug])

  const playModes = [
    {
      id: 'practice',
      name: 'Practice',
      description: 'Unlimited plays',
      icon: Target,
      color: '#22C55E',
      href: `/play/practice?game=${gameSlug}`,
      available: true,
      xp: '5 XP/correct',
    },
    {
      id: 'daily',
      name: 'Daily',
      description: status.daily.streak && status.daily.streak > 0 
        ? `${status.daily.streak} day streak!` 
        : 'Once per day',
      icon: Calendar,
      color: '#F59E0B',
      href: `/play/daily?game=${gameSlug}`,
      available: !status.daily.completed,
      completed: status.daily.completed,
      xp: '100+ XP',
      badge: status.daily.streak && status.daily.streak >= 3 ? 'STREAK' : undefined,
    },
    {
      id: 'flash',
      name: 'Flash',
      description: status.flash.completed ? 'Next in:' : '5 quick questions',
      icon: Zap,
      color: '#8B5CF6',
      href: `/play/flash?game=${gameSlug}`,
      available: !status.flash.completed,
      completed: status.flash.completed,
      nextAt: status.flash.nextAt,
      xp: '50+ XP',
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Play className="w-5 h-5 text-ggza-gold" />
        Quick Play
      </h3>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {playModes.map((mode) => (
            <Link
              key={mode.id}
              href={mode.href}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all',
                mode.available
                  ? 'bg-white/5 hover:bg-white/10 hover:scale-[1.02]'
                  : 'bg-white/5 opacity-60'
              )}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${mode.color}20` }}
              >
                {mode.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <mode.icon className="w-5 h-5" style={{ color: mode.color }} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{mode.name}</span>
                  {mode.badge && (
                    <Badge variant="warning" size="sm" className="text-[10px]">
                      🔥 {mode.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {mode.nextAt && mode.completed ? (
                    <Countdown targetDate={mode.nextAt} variant="compact" className="text-purple-400" />
                  ) : (
                    mode.description
                  )}
                </div>
              </div>
              
              <div className="text-xs text-ggza-gold font-medium">
                {mode.xp}
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <Link href="/play" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full">
          All Play Modes
        </Button>
      </Link>
    </Card>
  )
}

