'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Gamepad2, 
  Trophy, 
  Zap, 
  Calendar, 
  Clock, 
  Target, 
  Flame,
  Play,
  ArrowRight,
  Lock,
  CheckCircle
} from 'lucide-react'
import { Card, Badge, Button, Countdown } from '@/components/ui'
import { cn } from '@/lib/utils'

interface GameMode {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
  availability: string
  xpReward: string
  href: (game: string) => string
  isAvailable: boolean
  badge?: string
}

const GAMES = [
  { slug: 'cs2', name: 'Counter-Strike 2', color: '#DE9B35', image: '/cs2.png' },
  { slug: 'valorant', name: 'VALORANT', color: '#FD4556', image: '/valorant.jpg' },
  { slug: 'fifa', name: 'EA FC / FIFA', color: '#326295', image: '/fifa.jpg' },
  { slug: 'fortnite', name: 'Fortnite', color: '#9D4DFF', image: '/fortnite.jpg' },
  { slug: 'apex', name: 'Apex Legends', color: '#DA292A', image: '/apex.jpg' },
]

const GAME_MODES: GameMode[] = [
  {
    id: 'practice',
    name: 'Practice Mode',
    description: 'Unlimited plays to sharpen your knowledge. No pressure, just learning.',
    icon: <Target className="w-8 h-8" />,
    color: '#22C55E',
    gradient: 'from-green-500/20 to-emerald-600/20',
    availability: 'Always Available',
    xpReward: '5 XP per correct + 25 XP bonus',
    href: (game) => `/play/practice?game=${game}`,
    isAvailable: true,
  },
  {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'Fresh questions every day. Build your streak for bonus XP!',
    icon: <Calendar className="w-8 h-8" />,
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-orange-600/20',
    availability: 'Once per day',
    xpReward: '100+ XP (with streak bonus)',
    href: (game) => `/play/daily?game=${game}`,
    isAvailable: true,
    badge: 'STREAK BONUS',
  },
  {
    id: 'flash',
    name: 'Flash Quiz',
    description: 'Quick 5-question bursts. Speed matters - beat the clock for bonus XP!',
    icon: <Zap className="w-8 h-8" />,
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-purple-600/20',
    availability: 'New quiz every hour',
    xpReward: '50 XP + 25 XP speed bonus',
    href: (game) => `/play/flash?game=${game}`,
    isAvailable: true,
    badge: 'SPEED BONUS',
  },
  {
    id: 'live',
    name: 'Live Event',
    description: 'Weekly competitive quizzes with real cash prizes. The main event!',
    icon: <Trophy className="w-8 h-8" />,
    color: '#FFD700',
    gradient: 'from-ggza-gold/20 to-amber-500/20',
    availability: 'Weekly schedule',
    xpReward: 'Prize Pool: R1000+',
    href: (game) => `/hub/${game}`,
    isAvailable: true,
    badge: 'CASH PRIZES',
  },
]

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [dailyStatus, setDailyStatus] = useState<Record<string, boolean>>({})
  const [flashStatus, setFlashStatus] = useState<Record<string, { completed: boolean; nextAt?: string }>>({})

  // Check status for selected game
  useEffect(() => {
    if (!selectedGame) return
    
    // Check daily challenge status
    fetch(`/api/daily-challenge?game=${selectedGame}`)
      .then(res => res.json())
      .then(data => {
        setDailyStatus(prev => ({
          ...prev,
          [selectedGame]: data.status === 'completed'
        }))
      })
      .catch(() => {})
    
    // Check flash quiz status
    fetch(`/api/flash-quiz?game=${selectedGame}`)
      .then(res => res.json())
      .then(data => {
        setFlashStatus(prev => ({
          ...prev,
          [selectedGame]: {
            completed: data.status === 'completed',
            nextAt: data.nextFlashAt,
          }
        }))
      })
      .catch(() => {})
  }, [selectedGame])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display text-white mb-4">
          Choose Your <span className="text-gradient-gold">Challenge</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Multiple ways to play, earn XP, and prove your gaming knowledge. 
          Pick a game and mode to get started!
        </p>
      </div>

      {/* Game Selection */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-ggza-gold" />
          Select Your Game
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {GAMES.map((game) => (
            <button
              key={game.slug}
              onClick={() => setSelectedGame(game.slug)}
              className={cn(
                'relative rounded-2xl border-2 transition-all duration-300 overflow-hidden group aspect-[4/3]',
                selectedGame === game.slug
                  ? 'border-ggza-gold scale-105 shadow-lg shadow-ggza-gold/20'
                  : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
              )}
            >
              {/* Background Image */}
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div 
                className={cn(
                  'absolute inset-0 transition-opacity duration-300',
                  selectedGame === game.slug
                    ? 'bg-gradient-to-t from-black/90 via-black/50 to-transparent'
                    : 'bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70'
                )}
              />
              
              {/* Color accent line */}
              <div 
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-1 transition-all duration-300',
                  selectedGame === game.slug ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                )}
                style={{ backgroundColor: game.color }}
              />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-3">
                <div className="text-sm font-bold text-white drop-shadow-lg">{game.name}</div>
                
                {/* Selected indicator */}
                {selectedGame === game.slug && (
                  <div className="absolute top-2 right-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: game.color }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Game Modes */}
      {selectedGame ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-ggza-gold" />
            Choose Your Mode
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {GAME_MODES.map((mode) => {
              const isDailyCompleted = mode.id === 'daily' && dailyStatus[selectedGame]
              const isFlashCompleted = mode.id === 'flash' && flashStatus[selectedGame]?.completed
              const isCompleted = isDailyCompleted || isFlashCompleted
              
              return (
                <Link 
                  key={mode.id}
                  href={mode.href(selectedGame)}
                  className="group"
                >
                  <Card 
                    className={cn(
                      'p-6 h-full transition-all duration-300 relative overflow-hidden',
                      'hover:scale-[1.02] hover:shadow-xl',
                      isCompleted && 'opacity-75'
                    )}
                  >
                    {/* Background gradient */}
                    <div 
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity',
                        mode.gradient,
                        'group-hover:opacity-100'
                      )} 
                    />
                    
                    {/* Badge */}
                    {mode.badge && (
                      <div 
                        className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${mode.color}30`, color: mode.color }}
                      >
                        {mode.badge}
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      {/* Icon */}
                      <div 
                        className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${mode.color}20`, color: mode.color }}
                      >
                        {mode.icon}
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                        {mode.name}
                        {isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">{mode.description}</p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          {mode.availability}
                        </div>
                        <div className="flex items-center gap-1 text-ggza-gold">
                          <Flame className="w-4 h-4" />
                          {mode.xpReward}
                        </div>
                      </div>
                      
                      {/* Completed status */}
                      {isDailyCompleted && (
                        <div className="mt-4 p-2 rounded-lg bg-green-500/10 text-green-400 text-sm text-center">
                          ✓ Completed today! Come back tomorrow
                        </div>
                      )}
                      {isFlashCompleted && flashStatus[selectedGame]?.nextAt && (
                        <div className="mt-4 p-2 rounded-lg bg-purple-500/10 text-purple-400 text-sm text-center">
                          Next flash in: <Countdown targetDate={flashStatus[selectedGame]?.nextAt!} variant="compact" />
                        </div>
                      )}
                      
                      {/* Play button hint */}
                      {!isCompleted && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:text-ggza-gold transition-colors" style={{ color: mode.color }}>
                          Play Now
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a Game</h3>
          <p className="text-gray-400">Choose a game above to see available play modes</p>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Practice Anytime</h3>
          <p className="text-sm text-gray-400">
            No limits on practice mode. Play as much as you want to improve your knowledge before the big events.
          </p>
        </Card>
        
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Build Streaks</h3>
          <p className="text-sm text-gray-400">
            Complete daily challenges consecutively to build your streak. 7-day streaks earn 2x XP bonus!
          </p>
        </Card>
        
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-ggza-gold/10 flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-ggza-gold" />
          </div>
          <h3 className="font-semibold text-white mb-2">Win Cash Prizes</h3>
          <p className="text-sm text-gray-400">
            Weekly live events have real cash prizes. Your best 2 scores per week count toward rankings.
          </p>
        </Card>
      </div>
    </div>
  )
}

