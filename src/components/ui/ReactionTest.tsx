'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, X, RotateCcw, Trophy, Crown, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sounds } from '@/lib/sounds'

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'too-early'

// Mock leaderboard data - in a real app this would come from the backend
const MOCK_LEADERBOARD = [
  { rank: 1, username: 'FlashReflexes', time: 142, avatar: '🎯' },
  { rank: 2, username: 'SpeedDemon_ZA', time: 156, avatar: '⚡' },
  { rank: 3, username: 'QuickSilver', time: 163, avatar: '🚀' },
  { rank: 4, username: 'ReactionKing', time: 178, avatar: '👑' },
  { rank: 5, username: 'BlitzMaster', time: 184, avatar: '💨' },
  { rank: 6, username: 'NinjaFingers', time: 191, avatar: '🥷' },
  { rank: 7, username: 'SwiftGamer', time: 198, avatar: '🎮' },
  { rank: 8, username: 'RapidFire', time: 205, avatar: '🔥' },
  { rank: 9, username: 'LightningBolt', time: 212, avatar: '⚡' },
  { rank: 10, username: 'FastAndFurious', time: 219, avatar: '🏎️' },
]

export function ReactionTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load best time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ggza-reaction-best')
    if (saved) {
      setBestTime(parseInt(saved, 10))
    }
  }, [])

  const saveBestTime = useCallback((time: number) => {
    if (!bestTime || time < bestTime) {
      setBestTime(time)
      localStorage.setItem('ggza-reaction-best', time.toString())
    }
  }, [bestTime])

  const startGame = useCallback(() => {
    setGameState('waiting')
    setReactionTime(null)

    // Random delay between 1.5 and 5 seconds
    const delay = 1500 + Math.random() * 3500

    timeoutRef.current = setTimeout(() => {
      setGameState('ready')
      startTimeRef.current = performance.now()
      sounds.playStart()
    }, delay)
  }, [])

  const handleClick = useCallback(() => {
    if (gameState === 'waiting') {
      // Clicked too early!
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setGameState('too-early')
      sounds.playWrong()
    } else if (gameState === 'ready') {
      const time = Math.round(performance.now() - startTimeRef.current)
      setReactionTime(time)
      setAttempts(prev => [...prev.slice(-4), time])
      saveBestTime(time)
      setGameState('clicked')
      sounds.playCorrect()
    }
  }, [gameState, saveBestTime])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setGameState('idle')
    setReactionTime(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getTimeColor = (time: number) => {
    if (time < 200) return 'text-green-400'
    if (time < 300) return 'text-ggza-gold'
    if (time < 400) return 'text-orange-400'
    return 'text-red-400'
  }

  const getTimeLabel = (time: number) => {
    if (time < 150) return 'Inhuman! 🤖'
    if (time < 200) return 'Lightning fast! ⚡'
    if (time < 250) return 'Excellent! 🔥'
    if (time < 300) return 'Great! 👍'
    if (time < 350) return 'Good 👌'
    if (time < 400) return 'Average'
    return 'Keep practicing!'
  }

  const averageTime = attempts.length > 0
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    : null

  return (
    <>
      {/* Floating Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 group',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-ggza-gold to-amber-600',
          'shadow-lg shadow-ggza-gold/20',
          'flex items-center justify-center',
          'transition-all duration-300',
          'hover:scale-110 hover:shadow-xl hover:shadow-ggza-gold/30',
          'active:scale-95',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        title="Reaction Test"
      >
        <Zap className="w-6 h-6 text-ggza-black" />
        <span className="absolute -top-8 right-0 px-2 py-1 rounded bg-ggza-black-lighter text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Reaction Test
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (gameState === 'idle' || gameState === 'clicked' || gameState === 'too-early') {
              setIsOpen(false)
              reset()
            }
          }}
        >
          {/* Layout container - game centered, leaderboard floats right */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Game Card - Main centered container */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative w-full h-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden',
                'border border-white/10',
                'animate-in zoom-in-95 duration-200',
                'flex flex-col',
                'lg:mr-4'
              )}
            >
              {/* Header */}
              <div className="bg-ggza-black-lighter px-6 py-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ggza-gold/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-ggza-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-white">Reaction Test</h3>
                    <p className="text-xs text-gray-500">Test your reflexes</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    reset()
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Game Area */}
              <div
                onClick={() => {
                  if (gameState === 'idle') startGame()
                  else if (gameState === 'waiting' || gameState === 'ready') handleClick()
                  else if (gameState === 'clicked' || gameState === 'too-early') startGame()
                }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-200',
                  gameState === 'idle' && 'bg-ggza-black hover:bg-ggza-black-lighter',
                  gameState === 'waiting' && 'bg-red-900/50',
                  gameState === 'ready' && 'bg-green-600 animate-pulse',
                  gameState === 'clicked' && 'bg-ggza-black',
                  gameState === 'too-early' && 'bg-red-900/80'
                )}
              >
                {gameState === 'idle' && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-ggza-gold/20 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-10 h-10 text-ggza-gold" />
                    </div>
                    <p className="text-xl text-white font-display mb-2">Click to Start</p>
                    <p className="text-sm text-gray-400">Click when the screen turns green</p>
                  </div>
                )}

                {gameState === 'waiting' && (
                  <div className="text-center">
                    <p className="text-2xl text-white font-display mb-2">Wait for green...</p>
                    <p className="text-sm text-red-300">Don't click yet!</p>
                  </div>
                )}

                {gameState === 'ready' && (
                  <div className="text-center">
                    <p className="text-4xl text-white font-display animate-bounce">CLICK NOW!</p>
                  </div>
                )}

                {gameState === 'clicked' && reactionTime !== null && (
                  <div className="text-center">
                    <p className={cn('text-5xl font-display mb-2', getTimeColor(reactionTime))}>
                      {reactionTime}ms
                    </p>
                    <p className="text-lg text-gray-300 mb-4">{getTimeLabel(reactionTime)}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <RotateCcw className="w-4 h-4" />
                      <span>Click to try again</span>
                    </div>
                  </div>
                )}

                {gameState === 'too-early' && (
                  <div className="text-center">
                    <p className="text-3xl text-red-400 font-display mb-2">Too Early!</p>
                    <p className="text-gray-300 mb-4">Wait for the green screen</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <RotateCcw className="w-4 h-4" />
                      <span>Click to try again</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="bg-ggza-black-lighter px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {bestTime && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-ggza-gold" />
                        <span className="text-xs text-gray-400">Best:</span>
                        <span className={cn('text-sm font-mono font-bold', getTimeColor(bestTime))}>
                          {bestTime}ms
                        </span>
                      </div>
                    )}
                    {averageTime && (
                      <div>
                        <span className="text-xs text-gray-400">Avg:</span>
                        <span className="text-sm font-mono text-gray-300 ml-2">
                          {averageTime}ms
                        </span>
                      </div>
                    )}
                  </div>
                  {attempts.length > 0 && (
                    <div className="flex gap-1">
                      {attempts.map((time, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-2 h-2 rounded-full',
                            time < 250 ? 'bg-green-400' :
                            time < 350 ? 'bg-ggza-gold' :
                            'bg-red-400'
                          )}
                          title={`${time}ms`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard - Separate floating panel on the right */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'hidden lg:flex flex-col',
                'w-72 max-h-[90vh]',
                'rounded-2xl rounded-tl-none',
                'bg-gradient-to-br from-ggza-black-lighter to-ggza-black-light',
                'border border-white/5',
                'overflow-hidden',
                'animate-in slide-in-from-right-4 duration-300'
              )}
            >
              {/* Leaderboard Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Trophy className="w-4 h-4 text-ggza-gold" />
                  </div>
                  <span className="text-sm font-semibold text-white">Leaderboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ggza-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-ggza-gold"></span>
                  </span>
                  <span className="text-xs text-ggza-gold font-medium">TOP 10</span>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {MOCK_LEADERBOARD.map((entry, index) => {
                  const userWouldBeHere = bestTime && 
                    (index === 0 ? bestTime < entry.time : 
                      bestTime >= MOCK_LEADERBOARD[index - 1].time && bestTime < entry.time)
                  
                  return (
                    <div key={entry.rank}>
                      {/* Show user's position if they would be here */}
                      {userWouldBeHere && (
                        <div className="mb-1.5 p-2.5 rounded-xl bg-ggza-gold/20 border border-ggza-gold/40 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-ggza-gold/30 flex items-center justify-center text-xs font-bold text-ggza-gold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-ggza-gold truncate">You</p>
                          </div>
                          <span className={cn('font-mono text-xs font-bold', getTimeColor(bestTime))}>
                            {bestTime}ms
                          </span>
                        </div>
                      )}
                      
                      {/* Regular leaderboard entry */}
                      <div
                        className={cn(
                          'p-2.5 rounded-xl flex items-center gap-2.5 transition-all',
                          entry.rank <= 3 
                            ? 'bg-gradient-to-r from-white/5 to-transparent' 
                            : 'hover:bg-white/5'
                        )}
                      >
                        {/* Rank */}
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          entry.rank === 1 && 'bg-yellow-500/20 text-yellow-400',
                          entry.rank === 2 && 'bg-gray-400/20 text-gray-300',
                          entry.rank === 3 && 'bg-amber-600/20 text-amber-500',
                          entry.rank > 3 && 'bg-white/10 text-gray-500'
                        )}>
                          {entry.rank === 1 ? <Crown className="w-3.5 h-3.5" /> : 
                           entry.rank === 2 ? <Medal className="w-3.5 h-3.5" /> :
                           entry.rank === 3 ? <Medal className="w-3.5 h-3.5" /> :
                           entry.rank}
                        </div>

                        {/* Avatar & Name */}
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          {entry.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{entry.username}</p>
                        </div>

                        {/* Time */}
                        <span className={cn('font-mono text-xs font-bold', getTimeColor(entry.time))}>
                          {entry.time}ms
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Show user at bottom if not on leaderboard */}
                {bestTime && bestTime >= MOCK_LEADERBOARD[MOCK_LEADERBOARD.length - 1].time && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[10px] text-gray-500 mb-1.5 text-center uppercase tracking-wide">Your best time</p>
                    <div className="p-2.5 rounded-xl bg-ggza-gold/10 border border-ggza-gold/20 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                        —
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-300 truncate">You</p>
                      </div>
                      <span className={cn('font-mono text-xs font-bold', getTimeColor(bestTime))}>
                        {bestTime}ms
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                      Beat {MOCK_LEADERBOARD[MOCK_LEADERBOARD.length - 1].time}ms to enter!
                    </p>
                  </div>
                )}

                {/* Prompt to play if no best time */}
                {!bestTime && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-400">
                      Play to see where you rank!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

