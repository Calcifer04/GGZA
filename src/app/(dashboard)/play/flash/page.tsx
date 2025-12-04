'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Zap, AlertTriangle, Clock, CheckCircle, Play } from 'lucide-react'
import { Card, Button, Badge, Countdown } from '@/components/ui'
import { QuizPlayer, QuizResults, Question, QuizStats } from '@/components/quiz'
import Link from 'next/link'

function FlashContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameSlug = searchParams.get('game')
  
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'completed' | 'results' | 'error'>('loading')
  const [flashData, setFlashData] = useState<{
    flashQuiz: {
      id: string
      questionCount: number
      timePerQuestion: number
      xpReward: number
      bonusXpThresholdMs: number
      bonusXp: number
      startTime: string
      endTime: string
    }
    game: { slug: string; name: string; color: string }
    questions: Question[]
    attemptId?: string
  } | null>(null)
  const [nextFlashAt, setNextFlashAt] = useState<string | null>(null)
  const [results, setResults] = useState<{
    stats: any
    nextFlashAt: string
    newTotalXp: number
    newLevel: number
  } | null>(null)
  const [error, setError] = useState('')

  // Load flash quiz data
  useEffect(() => {
    if (!gameSlug) {
      router.push('/play')
      return
    }

    loadFlashQuiz()
  }, [gameSlug, router])

  const loadFlashQuiz = async () => {
    try {
      const res = await fetch(`/api/flash-quiz?game=${gameSlug}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load flash quiz')
      }
      
      if (data.status === 'completed') {
        setNextFlashAt(data.nextFlashAt)
        setFlashData({
          flashQuiz: data.flashQuiz,
          game: { slug: gameSlug!, name: '', color: '#8B5CF6' },
          questions: [],
        })
        setStatus('completed')
        return
      }
      
      setFlashData(data)
      setStatus(data.status === 'in_progress' ? 'playing' : 'ready')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const startFlashQuiz = async () => {
    if (!flashData) return
    
    try {
      const res = await fetch('/api/flash-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          flashQuizId: flashData.flashQuiz.id,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start flash quiz')
      }
      
      setFlashData(prev => prev ? { ...prev, attemptId: data.attemptId } : null)
      setStatus('playing')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleComplete = async (stats: QuizStats) => {
    if (!flashData) return
    
    try {
      const res = await fetch('/api/flash-quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashQuizId: flashData.flashQuiz.id }),
      })
      
      const data = await res.json()
      
      setResults({
        stats: data.stats,
        nextFlashAt: data.nextFlashAt,
        newTotalXp: data.newTotalXp,
        newLevel: data.newLevel,
      })
      setStatus('results')
    } catch (err) {
      console.error('Failed to complete flash quiz:', err)
    }
  }

  if (!gameSlug) return null

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading flash quiz...</p>
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
          <Button onClick={loadFlashQuiz}>Try Again</Button>
        </Card>
      </div>
    )
  }

  // Already completed this hour
  if (status === 'completed' && nextFlashAt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-display text-white mb-2">Completed!</h1>
          <p className="text-gray-400">You've already completed this hour's flash quiz.</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Next Flash Quiz In</div>
            <Countdown targetDate={nextFlashAt} variant="large" />
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Link href={`/play/practice?game=${gameSlug}`}>
            <Button variant="outline" className="w-full">
              Practice While You Wait
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
  if (status === 'ready' && flashData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-purple-400" />
          </div>
          <Badge 
            className="mb-4"
            style={{ backgroundColor: `${flashData.game.color}20`, color: flashData.game.color }}
          >
            {flashData.game.name}
          </Badge>
          <h1 className="text-3xl font-display text-white mb-2">Flash Quiz</h1>
          <p className="text-gray-400">Quick 5-question burst. Speed matters!</p>
        </div>

        {/* Timer Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-500/10 to-violet-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <div className="font-semibold text-white">Quiz Expires In</div>
                <div className="text-sm text-purple-400">New quiz every hour</div>
              </div>
            </div>
            <Countdown targetDate={flashData.flashQuiz.endTime} variant="compact" />
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Questions</span>
              <span className="text-white">{flashData.flashQuiz.questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time per question</span>
              <span className="text-white">{flashData.flashQuiz.timePerQuestion}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base XP Reward</span>
              <span className="text-ggza-gold">+{flashData.flashQuiz.xpReward} XP</span>
            </div>
            <div className="flex justify-between text-purple-400">
              <span>Speed Bonus (avg &lt;{flashData.flashQuiz.bonusXpThresholdMs / 1000}s)</span>
              <span>+{flashData.flashQuiz.bonusXp} XP</span>
            </div>
          </div>
        </Card>

        <Button onClick={startFlashQuiz} className="w-full" size="lg">
          <Zap className="w-5 h-5" />
          Start Flash Quiz
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          ⚡ Answer fast for the speed bonus!
        </p>
      </div>
    )
  }

  // Playing
  if (status === 'playing' && flashData) {
    return (
      <div className="px-4 py-8">
        <QuizPlayer
          questions={flashData.questions}
          config={{
            mode: 'flash',
            flashQuizId: flashData.flashQuiz.id,
            timePerQuestion: flashData.flashQuiz.timePerQuestion,
            xpPerCorrect: 10,
            game: flashData.game,
            showSpeedBonus: true,
            bonusThresholdMs: flashData.flashQuiz.bonusXpThresholdMs,
          }}
          onComplete={handleComplete}
          submitAnswerEndpoint="/api/flash-quiz"
        />
      </div>
    )
  }

  // Results
  if (status === 'results' && results && flashData) {
    return (
      <div className="px-4 py-8">
        <QuizResults
          mode="flash"
          game={flashData.game}
          stats={results.stats}
          newLevel={results.newLevel}
        />
        
        {results.nextFlashAt && (
          <Card className="p-6 mt-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Next Flash Quiz In</div>
              <Countdown targetDate={results.nextFlashAt} variant="large" />
            </div>
          </Card>
        )}
      </div>
    )
  }

  return null
}

export default function FlashPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FlashContent />
    </Suspense>
  )
}

