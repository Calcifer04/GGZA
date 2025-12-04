'use client'

import Link from 'next/link'
import { Trophy, Clock, Target, Flame, Zap, ArrowRight, RotateCcw, Home } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { formatTime } from '@/lib/utils'

interface QuizResultsProps {
  mode: 'practice' | 'daily' | 'flash' | 'live'
  game: {
    slug: string
    name: string
    color: string
  }
  stats: {
    correctAnswers: number
    totalQuestions: number
    totalTimeMs: number
    avgTimeMs?: number
    xpEarned: number
    accuracy: number
    streakMultiplier?: number
    gotSpeedBonus?: boolean
  }
  streak?: {
    current: number
    longest: number
  }
  newLevel?: number
  onPlayAgain?: () => void
}

export function QuizResults({ mode, game, stats, streak, newLevel, onPlayAgain }: QuizResultsProps) {
  const getGradeEmoji = (accuracy: number) => {
    if (accuracy >= 90) return '🏆'
    if (accuracy >= 80) return '🌟'
    if (accuracy >= 70) return '👍'
    if (accuracy >= 50) return '📚'
    return '💪'
  }

  const getGradeText = (accuracy: number) => {
    if (accuracy >= 90) return 'Outstanding!'
    if (accuracy >= 80) return 'Great Job!'
    if (accuracy >= 70) return 'Good Work!'
    if (accuracy >= 50) return 'Keep Practicing!'
    return 'Room to Improve!'
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge 
          className="mb-4"
          style={{ backgroundColor: `${game.color}20`, color: game.color }}
        >
          {game.name}
        </Badge>
        <div className="text-6xl mb-4">{getGradeEmoji(stats.accuracy)}</div>
        <h1 className="text-3xl font-display text-white mb-2">{getGradeText(stats.accuracy)}</h1>
        <p className="text-gray-400">
          {mode === 'practice' && 'Practice Session Complete'}
          {mode === 'daily' && 'Daily Challenge Complete'}
          {mode === 'flash' && 'Flash Quiz Complete'}
          {mode === 'live' && 'Quiz Complete'}
        </p>
      </div>

      {/* Main Score Card */}
      <Card className="p-8 mb-6 text-center glass-gold">
        <div className="text-6xl font-display text-ggza-gold mb-2">
          +{stats.xpEarned}
        </div>
        <div className="text-gray-400 mb-6">XP Earned</div>
        
        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white">
              <Target className="w-5 h-5 text-green-400" />
              {stats.correctAnswers}/{stats.totalQuestions}
            </div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-white">{stats.accuracy}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
              <Clock className="w-5 h-5 text-blue-400" />
              {formatTime(stats.totalTimeMs)}
            </div>
            <div className="text-sm text-gray-500">Time</div>
          </div>
        </div>

        {/* Bonuses */}
        {(stats.streakMultiplier && stats.streakMultiplier > 1) || stats.gotSpeedBonus ? (
          <div className="mt-6 pt-6 border-t border-ggza-gold/20">
            <div className="flex items-center justify-center gap-4">
              {stats.streakMultiplier && stats.streakMultiplier > 1 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400">
                  <Flame className="w-5 h-5" />
                  <span className="font-semibold">{stats.streakMultiplier}x Streak Bonus!</span>
                </div>
              )}
              {stats.gotSpeedBonus && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">Speed Bonus!</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* New Level */}
        {newLevel && (
          <div className="mt-6 pt-6 border-t border-ggza-gold/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ggza-gold/20 text-ggza-gold">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Level Up! Now Level {newLevel}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Streak Card (for daily challenges) */}
      {mode === 'daily' && streak && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Daily Streak</div>
                <div className="text-sm text-gray-400">Keep it going!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display text-amber-400">{streak.current}</div>
              <div className="text-sm text-gray-500">days</div>
            </div>
          </div>
          {streak.current >= 3 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 text-amber-400 text-sm text-center">
              {streak.current >= 7 
                ? '🔥 7+ day streak = 2x XP bonus on daily challenges!'
                : '🔥 3+ day streak = 1.5x XP bonus on daily challenges!'}
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {mode === 'practice' && onPlayAgain && (
          <Button onClick={onPlayAgain} variant="outline" className="w-full sm:w-auto">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        )}
        <Link href={`/hub/${game.slug}`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            <Home className="w-4 h-4" />
            Back to {game.name}
          </Button>
        </Link>
        <Link href="/play" className="w-full sm:w-auto">
          <Button className="w-full">
            More Games
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

