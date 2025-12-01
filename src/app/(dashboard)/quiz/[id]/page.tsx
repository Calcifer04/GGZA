'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, XCircle, Trophy } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { sounds } from '@/lib/sounds'

interface Question {
  id: string
  question_text: string
  options: string[]
  shuffled_indices: number[]
  time_limit: number
}

interface QuizState {
  status: 'waiting' | 'countdown' | 'active' | 'question' | 'result' | 'finished'
  currentQuestion: number
  questions: Question[]
  answers: { questionId: string; selectedIndex: number | null; timeMs: number; correct: boolean }[]
  timeRemaining: number
  score: number
  quizId: string
  gameSlug: string
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [state, setState] = useState<QuizState>({
    status: 'waiting',
    currentQuestion: 0,
    questions: [],
    answers: [],
    timeRemaining: 5,
    score: 0,
    quizId: params.id,
    gameSlug: '',
  })
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdownNumber, setCountdownNumber] = useState(3)
  const countdownStartedRef = useRef(false)

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quiz/${params.id}`)
        if (!res.ok) throw new Error('Failed to load quiz')
        
        const data = await res.json()
        
        if (data.status === 'completed') {
          router.push(`/quiz/${params.id}/results`)
          return
        }
        
        setState(prev => ({
          ...prev,
          questions: data.questions || [],
          gameSlug: data.gameSlug,
          status: data.status === 'live' ? 'countdown' : 'waiting',
        }))
        setLoading(false)
      } catch (err) {
        setError('Failed to load quiz')
        setLoading(false)
      }
    }
    
    loadQuiz()
  }, [params.id, router])

  // Countdown timer
  useEffect(() => {
    if (state.status !== 'countdown') return
    
    // Prevent countdown from restarting if already started
    if (countdownStartedRef.current) return
    countdownStartedRef.current = true
    
    // Reset countdown number when entering countdown state
    setCountdownNumber(3)
    
    // Play initial tick for 3
    sounds.playCountdownTick(3)
    
    // Animate 3 -> 2 -> 1 -> start
    const interval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          sounds.playStart()
          setState(s => ({ ...s, status: 'question' }))
          setQuestionStartTime(Date.now())
          countdownStartedRef.current = false
          return 0
        }
        // Play tick sound for next number
        sounds.playCountdownTick(prev - 1)
        return prev - 1
      })
    }, 1000)
    
    return () => {
      clearInterval(interval)
    }
  }, [state.status])

  // Question timer
  useEffect(() => {
    if (state.status !== 'question' || answerSubmitted) return
    
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - auto submit
          sounds.playTimeUp()
          handleSubmitAnswer(null)
          return prev
        }
        // Play tick sound when time is low
        if (prev.timeRemaining <= 3) {
          sounds.playTimerTick()
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [state.status, answerSubmitted])

  const handleSubmitAnswer = useCallback(async (answerIndex: number | null) => {
    if (answerSubmitted) return
    
    setAnswerSubmitted(true)
    const timeMs = Date.now() - questionStartTime
    const question = state.questions[state.currentQuestion]
    
    // Play click sound if user selected an answer
    if (answerIndex !== null) {
      sounds.playClick()
    }
    
    // Submit answer to server
    try {
      const res = await fetch(`/api/quiz/${params.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedIndex: answerIndex,
          timeMs,
        }),
      })
      
      const result = await res.json()
      
      // Play correct or wrong sound
      if (result.correct) {
        sounds.playCorrect()
      } else {
        sounds.playWrong()
      }
      
      setState(prev => ({
        ...prev,
        answers: [...prev.answers, {
          questionId: question.id,
          selectedIndex: answerIndex,
          timeMs,
          correct: result.correct,
        }],
        score: result.correct ? prev.score + 10 : prev.score,
        status: 'result',
      }))
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }, [answerSubmitted, questionStartTime, state.currentQuestion, state.questions, params.id])

  const handleNextQuestion = useCallback(() => {
    if (state.currentQuestion >= state.questions.length - 1) {
      // Quiz finished
      setState(prev => ({ ...prev, status: 'finished' }))
      router.push(`/quiz/${params.id}/results`)
      return
    }
    
    setState(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1,
      timeRemaining: 5,
      status: 'question',
    }))
    setSelectedAnswer(null)
    setAnswerSubmitted(false)
    setQuestionStartTime(Date.now())
  }, [state.currentQuestion, state.questions.length, params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ggza-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    )
  }

  if (state.status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Clock className="w-16 h-16 text-ggza-gold mx-auto mb-4" />
          <h2 className="text-2xl font-display text-white mb-2">Quiz Not Started</h2>
          <p className="text-gray-400 mb-6">The quiz hasn't started yet. Please wait for the host to begin.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    )
  }

  if (state.status === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display text-white mb-8">Quiz Starting...</h2>
          <div 
            key={countdownNumber} 
            className="text-8xl font-display text-ggza-gold animate-bounce"
          >
            {countdownNumber > 0 ? countdownNumber : 'GO!'}
          </div>
          <p className="text-gray-400 mt-8">Get ready!</p>
        </div>
      </div>
    )
  }

  const question = state.questions[state.currentQuestion]
  const lastAnswer = state.answers[state.answers.length - 1]

  return (
    <div className="min-h-screen bg-ggza-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-sm text-gray-500">Question</span>
            <div className="text-2xl font-display text-white">
              {state.currentQuestion + 1} / {state.questions.length}
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">Score</span>
            <div className="text-2xl font-display text-ggza-gold">{state.score}</div>
          </div>
          
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display',
            state.timeRemaining <= 2 ? 'bg-red-500/20 text-red-400 timer-urgent' : 'bg-ggza-gold/20 text-ggza-gold'
          )}>
            {state.status === 'question' ? state.timeRemaining : '-'}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-ggza-gold transition-all duration-300"
            style={{ width: `${((state.currentQuestion + 1) / state.questions.length) * 100}%` }}
          />
        </div>
        
        {/* Question Card */}
        <Card className="p-8 mb-6 no-select">
          {state.status === 'question' && (
            <>
              <h2 className="text-xl md:text-2xl text-white mb-8 text-center">
                {question.question_text}
              </h2>
              
              <div className="grid gap-4">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!answerSubmitted) {
                        setSelectedAnswer(index)
                        handleSubmitAnswer(index)
                      }
                    }}
                    disabled={answerSubmitted}
                    className={cn(
                      'p-4 rounded-xl text-left transition-all border-2 no-select',
                      selectedAnswer === index
                        ? 'border-ggza-gold bg-ggza-gold/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5',
                      answerSubmitted && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <span className="text-white">{option}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          
          {state.status === 'result' && lastAnswer && (
            <div className="text-center">
              {lastAnswer.correct ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-display text-green-400 mb-2">Correct!</h2>
                  <p className="text-gray-400">+10 points</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-display text-red-400 mb-2">
                    {lastAnswer.selectedIndex === null ? "Time's Up!" : 'Incorrect'}
                  </h2>
                  <p className="text-gray-400">Better luck next question!</p>
                </>
              )}
              
              <Button onClick={handleNextQuestion} className="mt-8">
                {state.currentQuestion >= state.questions.length - 1 ? 'See Results' : 'Next Question'}
              </Button>
            </div>
          )}
        </Card>
        
        {/* Answer Summary */}
        {state.answers.length > 0 && state.status === 'question' && (
          <div className="flex justify-center gap-2">
            {state.answers.map((answer, index) => (
              <div
                key={index}
                className={cn(
                  'w-3 h-3 rounded-full',
                  answer.correct ? 'bg-green-400' : 'bg-red-400'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

