'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, X, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sounds } from '@/lib/sounds'

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'too-early'

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
          {/* Game Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full h-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden',
              'border border-white/10',
              'animate-in zoom-in-95 duration-200',
              'flex flex-col'
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
        </div>
      )}
    </>
  )
}

