import Link from 'next/link'
import { Gamepad2, Calendar, Trophy, Users, ArrowRight } from 'lucide-react'
import { requireVerified } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Countdown } from '@/components/ui'
import { GAME_COLORS, DAY_NAMES, formatCurrency } from '@/lib/utils'

async function getHubData() {
  const supabase = createAdminSupabaseClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('quiz_day', { ascending: true })
  
  // Get next quiz for each game
  const gamesWithQuizzes = await Promise.all(
    (games || []).map(async (game) => {
      const { data: nextQuiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('game_id', game.id)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single()
      
      const { count: playerCount } = await supabase
        .from('user_games')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)
      
      return {
        ...game,
        nextQuiz,
        playerCount: playerCount || 0,
      }
    })
  )
  
  return gamesWithQuizzes
}

export default async function HubPage() {
  await requireVerified()
  const games = await getHubData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white mb-2">Game Hubs</h1>
        <p className="text-gray-400">Choose a game to view quizzes, leaderboards, and more</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Link key={game.id} href={`/hub/${game.slug}`}>
            <Card 
              interactive 
              className="h-full overflow-hidden group"
            >
              {/* Header with game color */}
              <div 
                className="h-2 -mx-6 -mt-6 mb-6"
                style={{ backgroundColor: game.color }}
              />
              
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${game.color}20` }}
                >
                  <Gamepad2 className="w-7 h-7" style={{ color: game.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-white mb-1 group-hover:text-ggza-gold transition-colors">
                    {game.display_name}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-2">{game.description}</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{DAY_NAMES[game.quiz_day]}s @ 7PM</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{game.playerCount} players</span>
                </div>
              </div>
              
              {/* Next Quiz */}
              {game.nextQuiz && (
                <div className="mt-4 p-3 rounded-xl bg-ggza-black border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Quiz</div>
                      <Countdown targetDate={game.nextQuiz.scheduled_at} variant="compact" />
                    </div>
                    <Badge variant="gold" size="sm">
                      {formatCurrency(game.nextQuiz.prize_pool)}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end mt-4 text-ggza-gold text-sm font-medium">
                Enter Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

