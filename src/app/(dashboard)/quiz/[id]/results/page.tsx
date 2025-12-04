import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, CheckCircle, XCircle, ArrowRight, Share2 } from 'lucide-react'
import { requireVerified } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Button, Avatar } from '@/components/ui'
import { formatTime, formatCurrency, getOrdinalSuffix, GAME_COLORS } from '@/lib/utils'

interface Props {
  params: { id: string }
}

async function getQuizResults(quizId: string, userId: string) {
  const supabase = createAdminSupabaseClient()
  
  // Get quiz details
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, game:games(*)')
    .eq('id', quizId)
    .single()
  
  if (!quiz) return null
  
  // Get user's responses
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
  
  // Get user's score
  let { data: userScore } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .single()
  
  // If no score exists but responses do, calculate and save the score
  if (!userScore && responses && responses.length > 0) {
    const correctCount = responses.filter(r => r.is_correct).length
    const totalTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0)
    const pointsPerCorrect = quiz.points_per_correct || 10
    const totalPoints = correctCount * pointsPerCorrect
    
    // Insert the score
    const { data: newScore } = await supabase
      .from('quiz_scores')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        total_points: totalPoints,
        correct_answers: correctCount,
        total_questions: quiz.question_count,
        total_time_ms: totalTime,
      })
      .select()
      .single()
    
    userScore = newScore
  }
  
  // Get leaderboard for this quiz
  const { data: leaderboard } = await supabase
    .from('quiz_scores')
    .select('*, user:users(id, discord_id, discord_username, discord_avatar, first_name)')
    .eq('quiz_id', quizId)
    .order('total_points', { ascending: false })
    .order('total_time_ms', { ascending: true })
    .limit(10)
  
  return {
    quiz,
    userScore,
    responses: responses || [],
    leaderboard: leaderboard || [],
  }
}

export default async function QuizResultsPage({ params }: Props) {
  const user = await requireVerified()
  const data = await getQuizResults(params.id, user.id)
  
  if (!data) {
    notFound()
  }
  
  const { quiz, userScore, responses, leaderboard } = data
  const correctCount = responses.filter(r => r.is_correct).length
  const percentage = Math.round((correctCount / responses.length) * 100) || 0
  
  // Find user's rank
  const userRankIndex = leaderboard.findIndex((s: any) => s.user_id === user.id)
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="game" gameSlug={quiz.game?.slug as any} className="mb-4">
          {quiz.game?.display_name}
        </Badge>
        <h1 className="text-3xl font-display text-white mb-2">{quiz.title}</h1>
        <p className="text-gray-400">Quiz Complete!</p>
      </div>
      
      {/* Score Card */}
      <Card className="p-8 mb-8 text-center glass-gold">
        <Trophy className="w-16 h-16 text-ggza-gold mx-auto mb-4" />
        
        <div className="text-6xl font-display text-ggza-gold mb-2">
          {userScore?.total_points || 0}
        </div>
        <div className="text-gray-400 mb-6">points</div>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-white">{correctCount}/{responses.length}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-white">{percentage}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-white">
              {userScore?.total_time_ms ? formatTime(userScore.total_time_ms) : '-'}
            </div>
            <div className="text-sm text-gray-500">Total Time</div>
          </div>
        </div>
        
        {userRank && userRank <= 3 && (
          <div className="mt-6 pt-6 border-t border-ggza-gold/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ggza-gold/20">
              <Trophy className="w-5 h-5 text-ggza-gold" />
              <span className="text-ggza-gold font-semibold">
                {getOrdinalSuffix(userRank)} Place! Prize: {formatCurrency(userRank === 1 ? 500 : userRank === 2 ? 300 : 200)}
              </span>
            </div>
          </div>
        )}
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Your Answers */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Answers</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {responses.map((response, index) => (
              <div 
                key={response.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${response.is_correct ? 'bg-green-500/10' : 'bg-red-500/10'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${response.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'}
                `}>
                  {response.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-400">Question {index + 1}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(response.response_time_ms)}
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Leaderboard */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-ggza-gold" />
            Quiz Leaderboard
          </h2>
          
          <div className="space-y-3">
            {leaderboard.map((entry: any, index: number) => (
              <div 
                key={entry.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${entry.user_id === user.id ? 'bg-ggza-gold/10 border border-ggza-gold/30' : ''}
                  ${index < 3 ? 'bg-white/5' : ''}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'rank-1' : ''}
                  ${index === 1 ? 'rank-2' : ''}
                  ${index === 2 ? 'rank-3' : ''}
                  ${index > 2 ? 'bg-white/5 text-gray-400' : ''}
                `}>
                  {index + 1}
                </div>
                <Avatar
                  discordId={entry.user?.discord_id || ''}
                  avatarHash={entry.user?.discord_avatar}
                  username={entry.user?.discord_username || ''}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {entry.user?.first_name || entry.user?.discord_username}
                    {entry.user_id === user.id && (
                      <span className="text-ggza-gold ml-1">(You)</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-ggza-gold">{entry.total_points} pts</div>
                  <div className="text-xs text-gray-500">{formatTime(entry.total_time_ms)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link href={`/hub/${quiz.game?.slug}`}>
          <Button variant="outline">
            Back to {quiz.game?.display_name} Hub
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button>
            View Full Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

