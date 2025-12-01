import { Suspense } from 'react'
import Link from 'next/link'
import { Trophy, Medal, Clock, Gamepad2 } from 'lucide-react'
import { requireVerified } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Avatar, Button } from '@/components/ui'
import { formatCurrency, GAME_COLORS, GAME_NAMES, getOrdinalSuffix, formatTime } from '@/lib/utils'

interface Props {
  searchParams: { game?: string; period?: string }
}

async function getLeaderboardData(gameSlug?: string, period: string = 'weekly') {
  const supabase = createAdminSupabaseClient()
  
  // Get all games
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('quiz_day', { ascending: true })
  
  // Get the selected game or first game
  const selectedGame = gameSlug 
    ? games?.find(g => g.slug === gameSlug) 
    : games?.[0]
  
  if (!selectedGame) {
    return { games: games || [], leaderboard: [], selectedGame: null, period }
  }
  
  // Get leaderboard
  const { data: leaderboard } = await supabase
    .from('leaderboards')
    .select('*, user:users(id, discord_id, discord_username, discord_avatar, first_name, last_name)')
    .eq('game_id', selectedGame.id)
    .eq('period_type', period)
    .order('total_points', { ascending: false })
    .order('average_time_ms', { ascending: true })
    .limit(100)
  
  return {
    games: games || [],
    leaderboard: leaderboard || [],
    selectedGame,
    period,
  }
}

export default async function LeaderboardPage({ searchParams }: Props) {
  await requireVerified()
  const { games, leaderboard, selectedGame, period } = await getLeaderboardData(
    searchParams.game,
    searchParams.period || 'weekly'
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-ggza-gold" />
          Leaderboards
        </h1>
        <p className="text-gray-400">See who's dominating the quiz scene</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Game Filter */}
        <div className="flex flex-wrap gap-2">
          {games.map((game: any) => (
            <Link 
              key={game.id} 
              href={`/leaderboard?game=${game.slug}&period=${period}`}
            >
              <Button
                variant={selectedGame?.slug === game.slug ? 'gold' : 'outline'}
                size="sm"
              >
                <Gamepad2 className="w-4 h-4" />
                {game.display_name}
              </Button>
            </Link>
          ))}
        </div>
        
        {/* Period Filter */}
        <div className="flex gap-2 sm:ml-auto">
          {[
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'all_time', label: 'All Time' },
          ].map((p) => (
            <Link 
              key={p.key} 
              href={`/leaderboard?game=${selectedGame?.slug || ''}&period=${p.key}`}
            >
              <Button
                variant={period === p.key ? 'gold' : 'ghost'}
                size="sm"
              >
                {p.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      
      {selectedGame && (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
              {/* 2nd Place */}
              <div className="flex flex-col items-center pt-8">
                <div className="relative mb-4">
                  <Avatar
                    discordId={leaderboard[1].user?.discord_id || ''}
                    avatarHash={leaderboard[1].user?.discord_avatar}
                    username={leaderboard[1].user?.discord_username || ''}
                    size="xl"
                    showRing
                    ringColor="gold"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full rank-2 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">
                    {leaderboard[1].user?.first_name || leaderboard[1].user?.discord_username}
                  </div>
                  <div className="text-2xl font-display text-gray-400">{leaderboard[1].total_points} pts</div>
                  <Badge variant="default" size="sm" className="mt-2">R300</Badge>
                </div>
              </div>
              
              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Trophy className="w-8 h-8 text-ggza-gold" />
                  </div>
                  <Avatar
                    discordId={leaderboard[0].user?.discord_id || ''}
                    avatarHash={leaderboard[0].user?.discord_avatar}
                    username={leaderboard[0].user?.discord_username || ''}
                    size="xl"
                    showRing
                    ringColor="gold"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full rank-1 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white text-lg">
                    {leaderboard[0].user?.first_name || leaderboard[0].user?.discord_username}
                  </div>
                  <div className="text-3xl font-display text-ggza-gold">{leaderboard[0].total_points} pts</div>
                  <Badge variant="gold" size="sm" className="mt-2">R500</Badge>
                </div>
              </div>
              
              {/* 3rd Place */}
              <div className="flex flex-col items-center pt-12">
                <div className="relative mb-4">
                  <Avatar
                    discordId={leaderboard[2].user?.discord_id || ''}
                    avatarHash={leaderboard[2].user?.discord_avatar}
                    username={leaderboard[2].user?.discord_username || ''}
                    size="xl"
                    showRing
                    ringColor="gold"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full rank-3 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">
                    {leaderboard[2].user?.first_name || leaderboard[2].user?.discord_username}
                  </div>
                  <div className="text-2xl font-display text-amber-700">{leaderboard[2].total_points} pts</div>
                  <Badge variant="default" size="sm" className="mt-2">R200</Badge>
                </div>
              </div>
            </div>
          )}
          
          {/* Full Leaderboard Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Rank</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Player</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Points</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400 hidden sm:table-cell">Quizzes</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400 hidden md:table-cell">Avg Time</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry: any, index: number) => (
                    <tr 
                      key={entry.id}
                      className={`
                        border-b border-white/5 hover:bg-white/5 transition-colors
                        ${index < 3 ? 'bg-ggza-gold/5' : ''}
                      `}
                    >
                      <td className="p-4">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                          ${index === 0 ? 'rank-1' : ''}
                          ${index === 1 ? 'rank-2' : ''}
                          ${index === 2 ? 'rank-3' : ''}
                          ${index > 2 ? 'bg-white/5 text-gray-400' : ''}
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            discordId={entry.user?.discord_id || ''}
                            avatarHash={entry.user?.discord_avatar}
                            username={entry.user?.discord_username || ''}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-white">
                              {entry.user?.first_name || entry.user?.discord_username}
                            </div>
                            <div className="text-xs text-gray-500">@{entry.user?.discord_username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-ggza-gold">{entry.total_points}</span>
                      </td>
                      <td className="p-4 text-right text-gray-400 hidden sm:table-cell">
                        {entry.quizzes_played}
                      </td>
                      <td className="p-4 text-right text-gray-400 hidden md:table-cell">
                        {entry.average_time_ms ? formatTime(entry.average_time_ms) : '-'}
                      </td>
                      <td className="p-4 text-right">
                        {index === 0 && <Badge variant="gold" size="sm">R500</Badge>}
                        {index === 1 && <Badge variant="default" size="sm">R300</Badge>}
                        {index === 2 && <Badge variant="default" size="sm">R200</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {leaderboard.length === 0 && (
              <div className="p-12 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No scores recorded yet for this period</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

