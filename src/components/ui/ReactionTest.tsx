'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, X, RotateCcw, Trophy, Crown, Medal, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sounds } from '@/lib/sounds'
import { Avatar } from './Avatar'

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'too-early'

interface LeaderboardEntry {
  rank: number
  username: string
  discordUsername: string
  discordAvatar: string | null
  discordId: string
  time: number
  attempts: number
}

interface UserScore {
  bestTime: number
  attempts: number
  rank: number | null
}

export function ReactionTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [displayState, setDisplayState] = useState<GameState>('idle')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const [isNewBest, setIsNewBest] = useState(false)
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userScore, setUserScore] = useState<UserScore | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // CRITICAL: Use refs for timing-sensitive values to avoid closure/state delays
  const gameStateRef = useRef<GameState>('idle')
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bestTimeRef = useRef<number | null>(null)

  // Sync bestTime ref
  useEffect(() => {
    bestTimeRef.current = bestTime
  }, [bestTime])

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/reaction')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      setLeaderboard(data.leaderboard || [])
      setUserScore(data.userScore)
      setTotalPlayers(data.totalPlayers)
      
      if (data.userScore?.bestTime) {
        setBestTime(data.userScore.bestTime)
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
    } finally {
      setLeaderboardLoading(false)
    }
  }, [])

  // Load leaderboard when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard()
    }
  }, [isOpen, fetchLeaderboard])

  // Also load best time from localStorage as fallback
  useEffect(() => {
    const saved = localStorage.getItem('ggza-reaction-best')
    if (saved && !bestTime) {
      const savedTime = parseInt(saved, 10)
      setBestTime(savedTime)
      bestTimeRef.current = savedTime
    }
  }, [bestTime])

  // Submit score to server (non-blocking)
  const submitScore = useCallback((time: number) => {
    setSubmitting(true)
    fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMs: time }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.isNewBest) {
          setIsNewBest(true)
        }
        fetchLeaderboard()
      })
      .catch(console.error)
      .finally(() => setSubmitting(false))
  }, [fetchLeaderboard])

  const startGame = useCallback(() => {
    // Update ref FIRST (synchronous)
    gameStateRef.current = 'waiting'
    setDisplayState('waiting')
    setReactionTime(null)
    setIsNewBest(false)

    // Random delay between 2 and 5 seconds
    const delay = 2000 + Math.random() * 3000

    timeoutRef.current = setTimeout(() => {
      // Capture start time with maximum precision
      startTimeRef.current = performance.now()
      gameStateRef.current = 'ready'
      setDisplayState('ready')
      sounds.playStart()
    }, delay)
  }, [])

  // CRITICAL: Ultra-fast click handler using refs (no state delays)
  const handleGameAreaClick = useCallback(() => {
    // Capture click time IMMEDIATELY - before any other code
    const clickTime = performance.now()
    
    // Use ref for instant state check (no closure delay)
    const currentState = gameStateRef.current

    if (currentState === 'idle') {
      startGame()
      return
    }

    if (currentState === 'waiting') {
      // Clicked too early!
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      gameStateRef.current = 'too-early'
      setDisplayState('too-early')
      sounds.playWrong()
      return
    }

    if (currentState === 'ready') {
      // Calculate reaction time with sub-millisecond precision, then round
      const rawTime = clickTime - startTimeRef.current
      const time = Math.round(rawTime)
      
      // Update state ref FIRST
      gameStateRef.current = 'clicked'
      
      // Then update display
      setReactionTime(time)
      setAttempts(prev => [...prev.slice(-4), time])
      setDisplayState('clicked')
      sounds.playCorrect()
      
      // Check for new best
      const currentBest = bestTimeRef.current
      if (!currentBest || time < currentBest) {
        setBestTime(time)
        bestTimeRef.current = time
        localStorage.setItem('ggza-reaction-best', time.toString())
        setIsNewBest(true)
      }
      
      // Submit to server (non-blocking)
      submitScore(time)
      return
    }

    if (currentState === 'clicked' || currentState === 'too-early') {
      startGame()
    }
  }, [startGame, submitScore])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    gameStateRef.current = 'idle'
    setDisplayState('idle')
    setReactionTime(null)
    setIsNewBest(false)
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
            const state = gameStateRef.current
            if (state === 'idle' || state === 'clicked' || state === 'too-early') {
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
                    <p className="text-xs text-gray-500">Test your reflexes • High precision timing</p>
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

              {/* Game Area - Use onMouseDown for faster response than onClick */}
              <div
                onMouseDown={handleGameAreaClick}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleGameAreaClick()
                }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-150',
                  displayState === 'idle' && 'bg-ggza-black hover:bg-ggza-black-lighter',
                  displayState === 'waiting' && 'bg-red-900/50',
                  displayState === 'ready' && 'bg-green-600',
                  displayState === 'clicked' && 'bg-ggza-black',
                  displayState === 'too-early' && 'bg-red-900/80'
                )}
              >
                {displayState === 'idle' && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-ggza-gold/20 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-10 h-10 text-ggza-gold" />
                    </div>
                    <p className="text-xl text-white font-display mb-2">Click to Start</p>
                    <p className="text-sm text-gray-400">Click/tap when the screen turns green</p>
                  </div>
                )}

                {displayState === 'waiting' && (
                  <div className="text-center">
                    <p className="text-2xl text-white font-display mb-2">Wait for green...</p>
                    <p className="text-sm text-red-300">Don't click yet!</p>
                  </div>
                )}

                {displayState === 'ready' && (
                  <div className="text-center">
                    <p className="text-5xl text-white font-display">CLICK!</p>
                  </div>
                )}

                {displayState === 'clicked' && reactionTime !== null && (
                  <div className="text-center">
                    <p className={cn('text-6xl font-display mb-2 tabular-nums', getTimeColor(reactionTime))}>
                      {reactionTime}<span className="text-3xl">ms</span>
                    </p>
                    <p className="text-lg text-gray-300 mb-2">{getTimeLabel(reactionTime)}</p>
                    {isNewBest && (
                      <p className="text-ggza-gold font-bold mb-2 animate-pulse">🎉 New Personal Best!</p>
                    )}
                    {submitting && (
                      <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
                      <RotateCcw className="w-4 h-4" />
                      <span>Click to try again</span>
                    </div>
                  </div>
                )}

                {displayState === 'too-early' && (
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
                        <span className={cn('text-sm font-mono font-bold tabular-nums', getTimeColor(bestTime))}>
                          {bestTime}ms
                        </span>
                      </div>
                    )}
                    {userScore?.rank && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rank:</span>
                        <span className="text-sm font-bold text-ggza-gold">#{userScore.rank}</span>
                        <span className="text-xs text-gray-500">/ {totalPlayers}</span>
                      </div>
                    )}
                    {averageTime && (
                      <div>
                        <span className="text-xs text-gray-400">Avg:</span>
                        <span className="text-sm font-mono text-gray-300 ml-2 tabular-nums">
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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span className="text-xs text-green-400 font-medium">LIVE</span>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {leaderboardLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-6 h-6 text-ggza-gold animate-spin" />
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <>
                    {leaderboard.map((entry, index) => {
                      const userWouldBeHere = userScore?.bestTime && 
                        !leaderboard.some(e => e.discordId === userScore?.rank?.toString()) &&
                        (index === 0 ? userScore.bestTime < entry.time : 
                          userScore.bestTime >= leaderboard[index - 1].time && userScore.bestTime < entry.time)
                      
                      return (
                        <div key={entry.rank}>
                          {/* Show user's position if they would be here but aren't in top 10 */}
                          {userWouldBeHere && (
                            <div className="mb-1.5 p-2.5 rounded-xl bg-ggza-gold/20 border border-ggza-gold/40 flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-ggza-gold/30 flex items-center justify-center text-xs font-bold text-ggza-gold">
                                {userScore?.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-ggza-gold truncate">You</p>
                              </div>
                              <span className={cn('font-mono text-xs font-bold tabular-nums', getTimeColor(userScore?.bestTime || 0))}>
                                {userScore?.bestTime}ms
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
                            {entry.discordAvatar ? (
                              <Avatar
                                discordId={entry.discordId}
                                avatarHash={entry.discordAvatar}
                                username={entry.discordUsername}
                                size="xs"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{entry.username}</p>
                            </div>

                            {/* Time */}
                            <span className={cn('font-mono text-xs font-bold tabular-nums', getTimeColor(entry.time))}>
                              {entry.time}ms
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Show user at bottom if not on leaderboard */}
                    {userScore && userScore.rank && userScore.rank > 10 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-[10px] text-gray-500 mb-1.5 text-center uppercase tracking-wide">Your position</p>
                        <div className="p-2.5 rounded-xl bg-ggza-gold/10 border border-ggza-gold/20 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-ggza-gold/20 flex items-center justify-center text-xs font-bold text-ggza-gold">
                            {userScore.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-300 truncate">You</p>
                          </div>
                          <span className={cn('font-mono text-xs font-bold tabular-nums', getTimeColor(userScore.bestTime))}>
                            {userScore.bestTime}ms
                          </span>
                        </div>
                        {leaderboard.length > 0 && (
                          <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                            Beat {leaderboard[leaderboard.length - 1].time}ms to enter top 10!
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No scores yet</p>
                    <p className="text-xs text-gray-500">Be the first!</p>
                  </div>
                )}

                {/* Prompt to play if no user score */}
                {!userScore && !leaderboardLoading && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-400">
                      Play to see where you rank!
                    </p>
                  </div>
                )}
              </div>

              {/* Total players footer */}
              <div className="px-4 py-2 border-t border-white/5 text-center">
                <span className="text-[10px] text-gray-500">
                  {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} total
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
