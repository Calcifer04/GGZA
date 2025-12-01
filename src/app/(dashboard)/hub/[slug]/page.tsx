import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Trophy, Users, Clock, Play, History, Award } from 'lucide-react'
import { requireVerified } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Countdown, Button, Avatar } from '@/components/ui'
import { formatCurrency, formatDate, DAY_NAMES, getOrdinalSuffix } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

async function getGameHubData(slug: string, userId: string) {
  const supabase = createAdminSupabaseClient()
  
  // Get game
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!game) return null
  
  // Get upcoming quizzes
  const { data: upcomingQuizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('game_id', game.id)
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)
  
  // Get past quizzes
  const { data: pastQuizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('game_id', game.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(5)
  
  // Get weekly leaderboard
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('*, user:users(id, discord_username, discord_avatar, first_name)')
    .eq('game_id', game.id)
    .eq('period_type', 'weekly')
    .order('total_points', { ascending: false })
    .limit(10)
  
  // Get user's rank
  const { data: userRank } = await supabase
    .from('leaderboards')
    .select('*')
    .eq('game_id', game.id)
    .eq('user_id', userId)
    .eq('period_type', 'weekly')
    .single()
  
  // Check if user follows this game
  const { data: userGame } = await supabase
    .from('user_games')
    .select('*')
    .eq('game_id', game.id)
    .eq('user_id', userId)
    .single()
  
  return {
    game,
    upcomingQuizzes: upcomingQuizzes || [],
    pastQuizzes: pastQuizzes || [],
    leaderboard: leaderboard || [],
    userRank,
    isFollowing: !!userGame,
  }
}

export default async function GameHubPage({ params }: Props) {
  const user = await requireVerified()
  const data = await getGameHubData(params.slug, user.id)
  
  if (!data) {
    notFound()
  }
  
  const { game, upcomingQuizzes, pastQuizzes, leaderboard, userRank, isFollowing } = data
  const nextQuiz = upcomingQuizzes[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div 
        className="relative rounded-2xl overflow-hidden mb-8 p-8"
        style={{ 
          background: `linear-gradient(135deg, ${game.color}20, transparent)`,
          borderLeft: `4px solid ${game.color}`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <Badge variant="game" gameSlug={game.slug as any} className="mb-3">
              {DAY_NAMES[game.quiz_day]}s @ 7PM SAST
            </Badge>
            <h1 className="text-4xl font-display text-white mb-2">{game.display_name}</h1>
            <p className="text-gray-400 max-w-xl">{game.description}</p>
          </div>
          
          {nextQuiz && (
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-500 mb-2">Next Quiz In</div>
              <Countdown targetDate={nextQuiz.scheduled_at} variant="large" />
              <Link href={`/quiz/${nextQuiz.id}`} className="mt-4 inline-block">
                <Button>
                  <Play className="w-4 h-4" />
                  Join Quiz
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Quizzes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ggza-gold" />
              Upcoming Quizzes
            </h2>
            
            {upcomingQuizzes.length > 0 ? (
              <div className="space-y-4">
                {upcomingQuizzes.map((quiz: any) => (
                  <Card key={quiz.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{quiz.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(quiz.scheduled_at, 'long')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {quiz.question_count} questions
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="gold">{formatCurrency(quiz.prize_pool)}</Badge>
                        <div className="mt-2">
                          <Countdown targetDate={quiz.scheduled_at} variant="compact" className="text-sm" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No quizzes scheduled yet</p>
              </Card>
            )}
          </section>
          
          {/* Past Results */}
          {pastQuizzes.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-ggza-gold" />
                Past Results
              </h2>
              
              <div className="space-y-3">
                {pastQuizzes.map((quiz: any) => (
                  <Card key={quiz.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{quiz.title}</h3>
                        <span className="text-sm text-gray-500">{formatDate(quiz.scheduled_at)}</span>
                      </div>
                      <Link href={`/quiz/${quiz.id}/results`}>
                        <Button variant="ghost" size="sm">View Results</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Sidebar - Leaderboard */}
        <div className="space-y-6">
          {/* Your Rank */}
          {userRank && (
            <Card className="p-6 glass-gold">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-ggza-gold" />
                Your Ranking
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-display text-ggza-gold">
                    {userRank.rank ? getOrdinalSuffix(userRank.rank) : '-'}
                  </div>
                  <div className="text-sm text-gray-400">This Week</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{userRank.total_points}</div>
                  <div className="text-sm text-gray-400">points</div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Weekly Leaderboard */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-ggza-gold" />
                Weekly Leaderboard
              </h3>
              <Link href={`/leaderboard?game=${game.slug}`} className="text-sm text-ggza-gold hover:underline">
                Full List
              </Link>
            </div>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                  <div 
                    key={entry.id} 
                    className={`
                      flex items-center gap-3 p-3 rounded-xl
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
                      discordId={entry.user?.id || ''}
                      avatarHash={entry.user?.discord_avatar}
                      username={entry.user?.discord_username || ''}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {entry.user?.first_name || entry.user?.discord_username}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-ggza-gold">
                      {entry.total_points}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No scores yet this week</p>
            )}
          </Card>
          
          {/* Prize Pool */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Weekly Prizes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">🥇 1st Place</span>
                <span className="font-semibold text-ggza-gold">R500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">🥈 2nd Place</span>
                <span className="font-semibold text-gray-300">R300</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">🥉 3rd Place</span>
                <span className="font-semibold text-gray-300">R200</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Based on best 2 quiz scores per week. Ties broken by fastest time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

