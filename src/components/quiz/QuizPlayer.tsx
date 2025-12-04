'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, XCircle, Trophy, Zap, Flame } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { sounds } from '@/lib/sounds'

export interface Question {
  id: string
  question_text: string
  options: string[]
  shuffled_indices: number[]
  order: number
  difficulty?: string
}

export interface QuizConfig {
  mode: 'practice' | 'daily' | 'flash' | 'live'
  sessionId?: string
  challengeId?: string
  flashQuizId?: string
  quizId?: string
  timePerQuestion: number
  xpPerCorrect?: number
  xpCompletionBonus?: number
  game: {
    slug: string
    name: string
    color: string
  }
  streak?: {
    current: number
    longest: number
  }
  showSpeedBonus?: boolean
  bonusThresholdMs?: number
}

interface QuizPlayerProps {
  questions: Question[]
  config: QuizConfig
  onComplete: (stats: QuizStats) => void
  submitAnswerEndpoint: string
}

export interface QuizStats {
  correctAnswers: number
  totalQuestions: number
  totalTimeMs: number
  avgTimeMs: number
  answers: AnswerResult[]
}

interface AnswerResult {
  questionId: string
  selectedIndex: number | null
  timeMs: number
  correct: boolean
}

export function QuizPlayer({ questions, config, onComplete, submitAnswerEndpoint }: QuizPlayerProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [status, setStatus] = useState<'countdown' | 'playing' | 'result' | 'finished' | 'error'>('countdown')
  const [timeRemaining, setTimeRemaining] = useState(config.timePerQuestion)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [answers, setAnswers] = useState<AnswerResult[]>([])
  const [lastResult, setLastResult] = useState<{ correct: boolean; correctIndex: number } | null>(null)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [score, setScore] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)

  // Countdown timer
  useEffect(() => {
    if (status !== 'countdown') return
    
    // Check if we have questions before starting
    if (!questions || questions.length === 0) {
      console.error('QuizPlayer: No questions provided')
      return
    }
    
    let countdownValue = 3
    setCountdownNumber(countdownValue)
    
    try {
      sounds.playCountdownTick(countdownValue)
    } catch (e) {
      // Ignore sound errors
    }
    
    const interval = setInterval(() => {
      countdownValue -= 1
      
      if (countdownValue <= 0) {
        clearInterval(interval)
        setCountdownNumber(0)
        try {
          sounds.playStart()
        } catch (e) {
          // Ignore sound errors
        }
        setStatus('playing')
        setQuestionStartTime(Date.now())
      } else {
        setCountdownNumber(countdownValue)
        try {
          sounds.playCountdownTick(countdownValue)
        } catch (e) {
          // Ignore sound errors
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [status, questions])

  // Question timer
  useEffect(() => {
    if (status !== 'playing' || answerSubmitted) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          sounds.playTimeUp()
          handleSubmitAnswer(null)
          return 0
        }
        if (prev <= 3) {
          sounds.playTimerTick()
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [status, answerSubmitted])

  const handleSubmitAnswer = useCallback(async (answerIndex: number | null) => {
    if (answerSubmitted) return
    
    setAnswerSubmitted(true)
    const timeMs = Date.now() - questionStartTime
    const question = questions[currentQuestion]
    
    if (answerIndex !== null) {
      sounds.playClick()
    }
    
    try {
      // Build request body based on mode
      const body: Record<string, any> = {
        questionId: question.id,
        selectedIndex: answerIndex,
        shuffledIndices: question.shuffled_indices,
        timeMs,
      }
      
      if (config.mode === 'practice') {
        body.sessionId = config.sessionId
      } else if (config.mode === 'daily') {
        body.action = 'answer'
        body.challengeId = config.challengeId
      } else if (config.mode === 'flash') {
        body.action = 'answer'
        body.flashQuizId = config.flashQuizId
      }
      
      const res = await fetch(submitAnswerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const result = await res.json()
      
      if (result.correct) {
        sounds.playCorrect()
        setScore(prev => prev + (config.xpPerCorrect || 10))
        setCurrentStreak(prev => prev + 1)
      } else {
        sounds.playWrong()
        setCurrentStreak(0)
      }
      
      const answerResult: AnswerResult = {
        questionId: question.id,
        selectedIndex: answerIndex,
        timeMs,
        correct: result.correct,
      }
      
      setAnswers(prev => [...prev, answerResult])
      setLastResult({ correct: result.correct, correctIndex: result.correctIndex })
      setStatus('result')
      
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }, [answerSubmitted, questionStartTime, currentQuestion, questions, config, submitAnswerEndpoint])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestion >= questions.length - 1) {
      // Quiz finished
      setStatus('finished')
      const totalTimeMs = answers.reduce((sum, a) => sum + a.timeMs, 0) + (lastResult ? Date.now() - questionStartTime : 0)
      onComplete({
        correctAnswers: answers.filter(a => a.correct).length + (lastResult?.correct ? 1 : 0),
        totalQuestions: questions.length,
        totalTimeMs,
        avgTimeMs: totalTimeMs / questions.length,
        answers: [...answers, ...(lastResult ? [{
          questionId: questions[currentQuestion].id,
          selectedIndex: selectedAnswer,
          timeMs: Date.now() - questionStartTime,
          correct: lastResult.correct,
        }] : [])],
      })
      return
    }
    
    setCurrentQuestion(prev => prev + 1)
    setTimeRemaining(config.timePerQuestion)
    setStatus('playing')
    setSelectedAnswer(null)
    setAnswerSubmitted(false)
    setLastResult(null)
    setQuestionStartTime(Date.now())
  }, [currentQuestion, questions, answers, lastResult, config.timePerQuestion, onComplete, questionStartTime, selectedAnswer])

  // Error screen - no questions
  if (!questions || questions.length === 0 || status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Questions Available</h2>
          <p className="text-gray-400 mb-6">
            There are no questions loaded for this quiz. Please try again later.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    )
  }

  // Countdown screen
  if (status === 'countdown') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Badge 
            className="mb-4"
            style={{ backgroundColor: `${config.game.color}20`, color: config.game.color }}
          >
            {config.game.name}
          </Badge>
          <h2 className="text-2xl font-display text-white mb-8">
            {config.mode === 'practice' && 'Practice Mode'}
            {config.mode === 'daily' && 'Daily Challenge'}
            {config.mode === 'flash' && 'Flash Quiz'}
            {config.mode === 'live' && 'Live Event'}
          </h2>
          <div 
            key={countdownNumber} 
            className="text-8xl font-display text-ggza-gold animate-bounce"
          >
            {countdownNumber > 0 ? countdownNumber : 'GO!'}
          </div>
          {config.streak && config.streak.current > 0 && (
            <div className="mt-8 flex items-center justify-center gap-2 text-amber-400">
              <Flame className="w-5 h-5" />
              <span>{config.streak.current} day streak!</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Finished screen (brief transition)
  if (status === 'finished') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-ggza-gold mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-display text-white mb-2">Complete!</h2>
          <p className="text-gray-400">Calculating results...</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Badge style={{ backgroundColor: `${config.game.color}20`, color: config.game.color }}>
            {config.mode === 'practice' && 'Practice'}
            {config.mode === 'daily' && 'Daily'}
            {config.mode === 'flash' && 'Flash'}
            {config.mode === 'live' && 'Live'}
          </Badge>
          <div className="text-2xl font-display text-white mt-1">
            {currentQuestion + 1} / {questions.length}
          </div>
        </div>
        
        <div className="text-center">
          <span className="text-sm text-gray-500">Score</span>
          <div className="text-2xl font-display text-ggza-gold">{score}</div>
        </div>
        
        {currentStreak > 1 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4" />
            <span className="font-bold">{currentStreak}</span>
          </div>
        )}
        
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display transition-all',
          timeRemaining <= 2 ? 'bg-red-500/20 text-red-400 animate-pulse scale-110' : 'bg-ggza-gold/20 text-ggza-gold'
        )}>
          {status === 'playing' ? timeRemaining : '-'}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            backgroundColor: config.game.color,
          }}
        />
      </div>
      
      {/* Question Card */}
      <Card className="p-8 mb-6 no-select">
        {status === 'playing' && (
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
            
            {config.showSpeedBonus && config.bonusThresholdMs && (
              <div className="mt-4 text-center text-sm text-purple-400 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Answer under {config.bonusThresholdMs / 1000}s for speed bonus!
              </div>
            )}
          </>
        )}
        
        {status === 'result' && lastResult && (
          <div className="text-center">
            {lastResult.correct ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-display text-green-400 mb-2">Correct!</h2>
                <p className="text-gray-400">+{config.xpPerCorrect || 10} XP</p>
                {currentStreak > 2 && (
                  <p className="text-amber-400 mt-2 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" />
                    {currentStreak} in a row!
                  </p>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-display text-red-400 mb-2">
                  {selectedAnswer === null ? "Time's Up!" : 'Incorrect'}
                </h2>
                <p className="text-gray-400">The correct answer was highlighted</p>
              </>
            )}
            
            <Button onClick={handleNextQuestion} className="mt-8">
              {currentQuestion >= questions.length - 1 ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        )}
      </Card>
      
      {/* Answer dots */}
      {answers.length > 0 && status === 'playing' && (
        <div className="flex justify-center gap-2">
          {answers.map((answer, index) => (
            <div
              key={index}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                answer.correct ? 'bg-green-400' : 'bg-red-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

