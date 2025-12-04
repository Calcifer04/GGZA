import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Button } from '@/components/ui'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  HelpCircle, 
  CheckCircle,
  AlertTriangle,
  Shuffle,
  Plus,
  Trash2
} from 'lucide-react'
import { formatCurrency, formatDate, GAME_COLORS } from '@/lib/utils'
import { QuizQuestionManager } from '@/components/admin/QuizQuestionManager'
import { QuizActions } from '@/components/admin/QuizActions'

interface Props {
  params: { id: string }
}

async function getQuizData(quizId: string) {
  const supabase = createAdminSupabaseClient()
  
  // Get quiz
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('*, game:games(*)')
    .eq('id', quizId)
    .single()
  
  if (error || !quiz) return null
  
  // Get quiz questions
  const { data: quizQuestions } = await supabase
    .from('quiz_questions')
    .select('*, question:questions(*)')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true })
  
  // Get available questions (not in quiz)
  const existingIds = quizQuestions?.map(qq => qq.question_id) || []
  
  let availableQuery = supabase
    .from('questions')
    .select('*')
    .eq('game_id', quiz.game_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (existingIds.length > 0) {
    availableQuery = availableQuery.not('id', 'in', `(${existingIds.join(',')})`)
  }
  
  const { data: availableQuestions } = await availableQuery
  
  // Get player count if completed
  let playerCount = 0
  if (quiz.status === 'completed' || quiz.status === 'live') {
    const { count } = await supabase
      .from('quiz_scores')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
    playerCount = count || 0
  }
  
  return {
    quiz,
    quizQuestions: quizQuestions || [],
    availableQuestions: availableQuestions || [],
    playerCount,
  }
}

export default async function QuizDetailPage({ params }: Props) {
  await requireAdmin()
  const data = await getQuizData(params.id)
  
  if (!data) {
    notFound()
  }
  
  const { quiz, quizQuestions, availableQuestions, playerCount } = data
  const questionsNeeded = quiz.question_count - quizQuestions.length
  const isReady = questionsNeeded <= 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="warning" size="lg">Scheduled</Badge>
      case 'live':
        return <Badge variant="success" size="lg" className="animate-pulse">🔴 LIVE</Badge>
      case 'completed':
        return <Badge variant="default" size="lg">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger" size="lg">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link 
        href="/admin/quizzes" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="game" gameSlug={quiz.game?.slug}>
              {quiz.game?.display_name}
            </Badge>
            {getStatusBadge(quiz.status)}
          </div>
          <h1 className="text-3xl font-display text-white mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-400">{quiz.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <QuizActions quiz={quiz} />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <Calendar className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-lg font-bold text-white">{formatDate(quiz.scheduled_at)}</div>
          <div className="text-sm text-gray-500">
            {new Date(quiz.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </Card>
        
        <Card className="p-4">
          <Clock className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-lg font-bold text-white">{quiz.time_per_question}s</div>
          <div className="text-sm text-gray-500">Per Question</div>
        </Card>
        
        <Card className="p-4">
          <HelpCircle className="w-5 h-5 text-amber-400 mb-2" />
          <div className={`text-lg font-bold ${isReady ? 'text-green-400' : 'text-amber-400'}`}>
            {quizQuestions.length}/{quiz.question_count}
          </div>
          <div className="text-sm text-gray-500">Questions</div>
        </Card>
        
        <Card className="p-4">
          <Trophy className="w-5 h-5 text-ggza-gold mb-2" />
          <div className="text-lg font-bold text-ggza-gold">{formatCurrency(quiz.prize_pool)}</div>
          <div className="text-sm text-gray-500">Prize Pool</div>
        </Card>
        
        <Card className="p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-lg font-bold text-white">{playerCount}</div>
          <div className="text-sm text-gray-500">Players</div>
        </Card>
      </div>
      
      {/* Readiness Alert */}
      {quiz.status === 'scheduled' && (
        <Card className={`p-4 mb-8 ${isReady ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <div className="flex items-center gap-3">
            {isReady ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <div className="font-semibold text-green-400">Quiz Ready!</div>
                  <div className="text-sm text-green-400/70">
                    All questions loaded. Quiz will start automatically at scheduled time, or you can start it manually.
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-400">Questions Needed</div>
                  <div className="text-sm text-amber-400/70">
                    Add {questionsNeeded} more question{questionsNeeded > 1 ? 's' : ''} to complete this quiz. 
                    Use the auto-select feature below to quickly fill from your question bank.
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
      
      {/* Question Manager */}
      {quiz.status === 'scheduled' && (
        <QuizQuestionManager 
          quizId={quiz.id}
          gameId={quiz.game_id}
          questionCount={quiz.question_count}
          currentQuestions={quizQuestions}
          availableQuestions={availableQuestions}
        />
      )}
      
      {/* View-only questions for completed/live quizzes */}
      {(quiz.status === 'completed' || quiz.status === 'live') && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quiz Questions</h2>
          <div className="space-y-3">
            {quizQuestions.map((qq: any, index: number) => (
              <div key={qq.id} className="p-4 rounded-xl bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-white mb-2">{qq.question.question_text}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {qq.question.options.map((option: string, optIndex: number) => (
                        <div 
                          key={optIndex}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            optIndex === qq.question.correct_index 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          {option}
                          {optIndex === qq.question.correct_index && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

