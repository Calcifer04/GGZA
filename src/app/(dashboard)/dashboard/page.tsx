import Link from 'next/link'
import { Calendar, Trophy, Gamepad2, ArrowRight, Clock, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Countdown, Button, MarqueeCarousel } from '@/components/ui'
import { SidePanel } from '@/components/dashboard'
import { formatCurrency, GAME_NAMES, GAME_COLORS, DAY_NAMES } from '@/lib/utils'

async function getDashboardData(userId: string) {
  const supabase = createAdminSupabaseClient()
  
  // Get user's games
  const { data: userGames } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', userId)
  
  // Get upcoming quizzes
  const { data: upcomingQuizzes } = await supabase
    .from('quizzes')
    .select('*, game:games(*)')
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)
  
  // Get user's recent scores
  const { data: recentScores } = await supabase
    .from('quiz_scores')
    .select('*, quiz:quizzes(*, game:games(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Get all games for display
  const { data: allGames } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('quiz_day', { ascending: true })
  
  return {
    userGames: userGames || [],
    upcomingQuizzes: upcomingQuizzes || [],
    recentScores: recentScores || [],
    allGames: allGames || [],
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const { userGames, upcomingQuizzes, recentScores, allGames } = await getDashboardData(user.id)
  
  const favoriteGameIds = userGames.filter(ug => ug.is_favorite).map(ug => ug.game_id)
  const userGameSlugs = userGames.map(ug => ug.game?.slug)

  return (
    <>
    {/* Collapsible Side Panel - Live Stats & Missions */}
    <SidePanel />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 xl:mr-80">
      {/* Welcome Header with Carousel */}
      <div className="mb-8 flex items-center gap-6">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-display text-white mb-2">
            Welcome back, <span className="text-gradient-gold">{user.first_name || user.discord_username}</span>
          </h1>
          <p className="text-gray-400">Ready for your next quiz challenge?</p>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl">
          <MarqueeCarousel />
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ggza-gold/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-ggza-gold" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user.total_wins}</div>
              <div className="text-sm text-gray-500">Total Wins</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <span className="text-green-400 font-bold">R</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatCurrency(user.total_earnings)}</div>
              <div className="text-sm text-gray-500">Earnings</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{recentScores.length}</div>
              <div className="text-sm text-gray-500">Quizzes Played</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{userGames.length}</div>
              <div className="text-sm text-gray-500">Games Following</div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Quizzes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Upcoming Quizzes</h2>
              <Link href="/hub" className="text-sm text-ggza-gold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingQuizzes.length > 0 ? (
              <div className="space-y-4">
                {upcomingQuizzes.map((quiz: any) => (
                  <Card 
                    key={quiz.id} 
                    variant="game" 
                    gameSlug={quiz.game?.slug}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${GAME_COLORS[quiz.game?.slug]}20` }}
                        >
                          <Gamepad2 
                            className="w-6 h-6" 
                            style={{ color: GAME_COLORS[quiz.game?.slug] }} 
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{quiz.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(quiz.scheduled_at).toLocaleDateString('en-ZA', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="gold" size="sm">{formatCurrency(quiz.prize_pool)}</Badge>
                        <div className="mt-2">
                          <Countdown 
                            targetDate={quiz.scheduled_at} 
                            variant="compact"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No upcoming quizzes scheduled</p>
              </Card>
            )}
          </section>
          
          {/* Recent Results */}
          {recentScores.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Results</h2>
              <div className="space-y-3">
                {recentScores.map((score: any) => (
                  <Card key={score.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${GAME_COLORS[score.quiz?.game?.slug]}20` }}
                        >
                          <Gamepad2 
                            className="w-5 h-5" 
                            style={{ color: GAME_COLORS[score.quiz?.game?.slug] }} 
                          />
                        </div>
                        <div>
                          <div className="font-medium text-white">{score.quiz?.title}</div>
                          <div className="text-sm text-gray-500">
                            {score.correct_answers}/{score.total_questions} correct
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-ggza-gold">{score.total_points} pts</div>
                        {score.rank && (
                          <Badge 
                            variant={score.rank <= 3 ? 'gold' : 'default'} 
                            size="sm"
                          >
                            #{score.rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Games */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Your Games</h3>
            <div className="space-y-3">
              {allGames.map((game: any) => {
                const isFollowing = userGameSlugs.includes(game.slug)
                return (
                  <Link 
                    key={game.id} 
                    href={`/hub/${game.slug}`}
                    className={`
                      flex items-center justify-between p-3 rounded-xl transition-all
                      ${isFollowing 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'opacity-50 hover:opacity-100'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${game.color}20` }}
                      >
                        <Gamepad2 className="w-4 h-4" style={{ color: game.color }} />
                      </div>
                      <span className="text-sm text-white">{game.display_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{DAY_NAMES[game.quiz_day]}s</span>
                  </Link>
                )
              })}
            </div>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="w-full mt-4">
                Edit Games
              </Button>
            </Link>
          </Card>
          
          {/* Weekly Schedule */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Weekly Schedule</h3>
            <div className="space-y-2 text-sm">
              {allGames.map((game: any) => (
                <div key={game.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-gray-400">{DAY_NAMES[game.quiz_day]}</span>
                  <span style={{ color: game.color }}>{game.display_name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">All quizzes start at 7:00 PM SAST</p>
          </Card>
          
          {/* Prize Info */}
          <Card className="p-6 glass-gold">
            <Trophy className="w-8 h-8 text-ggza-gold mb-3" />
            <h3 className="font-semibold text-white mb-2">Weekly Prizes</h3>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">1st Place</span>
                <span className="text-ggza-gold font-semibold">R500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">2nd Place</span>
                <span className="text-gray-300">R300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">3rd Place</span>
                <span className="text-gray-300">R200</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Based on best 2 quiz scores per week
            </p>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}

