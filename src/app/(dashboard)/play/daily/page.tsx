'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar, AlertTriangle, Flame, CheckCircle, Play } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { QuizPlayer, QuizResults, Question, QuizStats } from '@/components/quiz'
import Link from 'next/link'

function DailyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameSlug = searchParams.get('game')
  
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'completed' | 'results' | 'error'>('loading')
  const [challengeData, setChallengeData] = useState<{
    challenge: {
      id: string
      title: string
      description: string
      questionCount: number
      timePerQuestion: number
      xpReward: number
      streakBonusMultiplier: number
    }
    game: { slug: string; name: string; color: string }
    questions: Question[]
    streak: { current: number; longest: number; total: number }
    attemptId?: string
  } | null>(null)
  const [results, setResults] = useState<{
    stats: any
    streak: any
    newTotalXp: number
    newLevel: number
  } | null>(null)
  const [error, setError] = useState('')

  // Load daily challenge data
  useEffect(() => {
    if (!gameSlug) {
      router.push('/play')
      return
    }

    loadChallenge()
  }, [gameSlug, router])

  const loadChallenge = async () => {
    try {
      const res = await fetch(`/api/daily-challenge?game=${gameSlug}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load challenge')
      }
      
      if (data.status === 'completed') {
        setChallengeData({
          ...data,
          challenge: data.challenge || { id: '', title: 'Daily Challenge', xpReward: 100 },
        })
        setStatus('completed')
        return
      }
      
      setChallengeData(data)
      setStatus(data.status === 'in_progress' ? 'playing' : 'ready')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const startChallenge = async () => {
    if (!challengeData) return
    
    try {
      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          challengeId: challengeData.challenge.id,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start challenge')
      }
      
      setChallengeData(prev => prev ? { ...prev, attemptId: data.attemptId } : null)
      setStatus('playing')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleComplete = async (stats: QuizStats) => {
    if (!challengeData) return
    
    try {
      const res = await fetch('/api/daily-challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challengeData.challenge.id }),
      })
      
      const data = await res.json()
      
      setResults({
        stats: data.stats,
        streak: data.streak,
        newTotalXp: data.newTotalXp,
        newLevel: data.newLevel,
      })
      setStatus('results')
    } catch (err) {
      console.error('Failed to complete challenge:', err)
    }
  }

  if (!gameSlug) return null

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading daily challenge...</p>
        </div>
      </div>
    )
  }

  // Error
  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={loadChallenge}>Try Again</Button>
        </Card>
      </div>
    )
  }

  // Already completed
  if (status === 'completed' && challengeData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-display text-white mb-2">Already Completed!</h1>
          <p className="text-gray-400">You've already completed today's {challengeData.game.name} challenge.</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Your Streak</div>
              <div className="text-sm text-gray-400">Keep it going tomorrow!</div>
            </div>
            <div className="text-3xl font-display text-amber-400">
              {challengeData.streak?.current || 0}
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Link href={`/play/practice?game=${gameSlug}`}>
            <Button variant="outline" className="w-full">
              Practice More
            </Button>
          </Link>
          <Link href="/play">
            <Button className="w-full">
              Try Another Game
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Ready to start
  if (status === 'ready' && challengeData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-amber-400" />
          </div>
          <Badge 
            className="mb-4"
            style={{ backgroundColor: `${challengeData.game.color}20`, color: challengeData.game.color }}
          >
            {challengeData.game.name}
          </Badge>
          <h1 className="text-3xl font-display text-white mb-2">{challengeData.challenge.title}</h1>
          <p className="text-gray-400">{challengeData.challenge.description}</p>
        </div>

        {/* Streak Card */}
        {challengeData.streak.current > 0 && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">
                    {challengeData.streak.current} Day Streak!
                  </div>
                  <div className="text-sm text-amber-400">
                    {challengeData.streak.current >= 7 
                      ? '2x XP Bonus Active!' 
                      : challengeData.streak.current >= 3 
                        ? '1.5x XP Bonus Active!' 
                        : `${3 - challengeData.streak.current} more days for streak bonus`}
                  </div>
                </div>
              </div>
              <div className="text-3xl font-display text-amber-400">
                🔥
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Questions</span>
              <span className="text-white">{challengeData.challenge.questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time per question</span>
              <span className="text-white">{challengeData.challenge.timePerQuestion}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base XP Reward</span>
              <span className="text-ggza-gold">+{challengeData.challenge.xpReward} XP</span>
            </div>
            {challengeData.streak.current >= 3 && (
              <div className="flex justify-between text-amber-400">
                <span>Streak Bonus</span>
                <span>{challengeData.streak.current >= 7 ? '2x' : '1.5x'}</span>
              </div>
            )}
          </div>
        </Card>

        <Button onClick={startChallenge} className="w-full" size="lg">
          <Play className="w-5 h-5" />
          Start Challenge
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          ⚠️ You only get one attempt per day!
        </p>
      </div>
    )
  }

  // Playing
  if (status === 'playing' && challengeData) {
    return (
      <div className="px-4 py-8">
        <QuizPlayer
          questions={challengeData.questions}
          config={{
            mode: 'daily',
            challengeId: challengeData.challenge.id,
            timePerQuestion: challengeData.challenge.timePerQuestion,
            xpPerCorrect: 10,
            game: challengeData.game,
            streak: challengeData.streak,
          }}
          onComplete={handleComplete}
          submitAnswerEndpoint="/api/daily-challenge"
        />
      </div>
    )
  }

  // Results
  if (status === 'results' && results && challengeData) {
    return (
      <div className="px-4 py-8">
        <QuizResults
          mode="daily"
          game={challengeData.game}
          stats={results.stats}
          streak={results.streak}
          newLevel={results.newLevel}
        />
      </div>
    )
  }

  return null
}

export default function DailyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DailyContent />
    </Suspense>
  )
}

