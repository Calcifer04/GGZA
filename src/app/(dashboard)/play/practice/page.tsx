'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Target, AlertTriangle, Settings, Play } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { QuizPlayer, QuizResults, Question, QuizStats } from '@/components/quiz'

function PracticeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameSlug = searchParams.get('game')
  
  const [status, setStatus] = useState<'setup' | 'loading' | 'playing' | 'results' | 'error'>('setup')
  const [questionCount, setQuestionCount] = useState(10)
  const [sessionData, setSessionData] = useState<{
    sessionId: string
    game: { slug: string; name: string; color: string }
    questions: Question[]
    timePerQuestion: number
    xpPerCorrect: number
    xpCompletionBonus: number
  } | null>(null)
  const [results, setResults] = useState<{
    stats: any
    newTotalXp: number
    newLevel: number
  } | null>(null)
  const [error, setError] = useState('')

  // Redirect if no game selected
  useEffect(() => {
    if (!gameSlug) {
      router.push('/play')
    }
  }, [gameSlug, router])

  const startPractice = async () => {
    setStatus('loading')
    setError('')
    
    try {
      const res = await fetch(`/api/practice?game=${gameSlug}&count=${questionCount}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start practice')
      }
      
      setSessionData(data)
      setStatus('playing')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleComplete = async (stats: QuizStats) => {
    if (!sessionData) return
    
    try {
      const res = await fetch('/api/practice/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionData.sessionId }),
      })
      
      const data = await res.json()
      
      setResults({
        stats: {
          ...data.stats,
          xpEarned: data.stats.xpEarned,
        },
        newTotalXp: data.newTotalXp,
        newLevel: data.newLevel,
      })
      setStatus('results')
    } catch (err) {
      console.error('Failed to complete practice:', err)
      setStatus('results')
      setResults({
        stats: {
          correctAnswers: stats.correctAnswers,
          totalQuestions: stats.totalQuestions,
          totalTimeMs: stats.totalTimeMs,
          accuracy: Math.round((stats.correctAnswers / stats.totalQuestions) * 100),
          xpEarned: (stats.correctAnswers * 5) + 25,
        },
        newTotalXp: 0,
        newLevel: 1,
      })
    }
  }

  const handlePlayAgain = () => {
    setStatus('setup')
    setSessionData(null)
    setResults(null)
  }

  if (!gameSlug) {
    return null
  }

  // Setup screen
  if (status === 'setup') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-display text-white mb-2">Practice Mode</h1>
          <p className="text-gray-400">Unlimited plays. No pressure. Just learning.</p>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-ggza-gold" />
            Session Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`
                      p-3 rounded-xl text-center transition-all
                      ${questionCount === count 
                        ? 'bg-ggza-gold text-black font-bold' 
                        : 'bg-white/5 text-white hover:bg-white/10'}
                    `}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">XP per correct answer</span>
                <span className="text-green-400">+5 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completion bonus</span>
                <span className="text-green-400">+25 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time per question</span>
                <span className="text-white">10 seconds</span>
              </div>
            </div>
          </div>
        </Card>

        <Button onClick={startPractice} className="w-full" size="lg">
          <Play className="w-5 h-5" />
          Start Practice
        </Button>
      </div>
    )
  }

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading questions...</p>
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
          <Button onClick={() => setStatus('setup')}>Try Again</Button>
        </Card>
      </div>
    )
  }

  // Playing
  if (status === 'playing' && sessionData) {
    return (
      <div className="px-4 py-8">
        <QuizPlayer
          questions={sessionData.questions}
          config={{
            mode: 'practice',
            sessionId: sessionData.sessionId,
            timePerQuestion: sessionData.timePerQuestion,
            xpPerCorrect: sessionData.xpPerCorrect,
            xpCompletionBonus: sessionData.xpCompletionBonus,
            game: sessionData.game,
          }}
          onComplete={handleComplete}
          submitAnswerEndpoint="/api/practice"
        />
      </div>
    )
  }

  // Results
  if (status === 'results' && results && sessionData) {
    return (
      <div className="px-4 py-8">
        <QuizResults
          mode="practice"
          game={sessionData.game}
          stats={results.stats}
          newLevel={results.newLevel}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    )
  }

  return null
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}

