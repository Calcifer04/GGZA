import Image from 'next/image'
import { requireAuth } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { TransactionHistory } from '@/components/profile/TransactionHistory'
import { Card, Avatar, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getLevelInfo } from '@/lib/xp'
import { Trophy, Wallet, Calendar, Shield, Star, Zap, Flame } from 'lucide-react'

const GAME_IMAGES: Record<string, string> = {
  cs2: '/cs2.png',
  valorant: '/valorant.jpg',
  fifa: '/fifa.jpg',
  fortnite: '/fortnite.jpg',
  apex: '/apex.jpg',
}

async function getProfileData(userId: string) {
  const supabase = createAdminSupabaseClient()
  
  // Get user with games
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  // Get user's games
  const { data: userGames } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', userId)
  
  // Get all games
  const { data: allGames } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
  
  // Get payouts
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Get recent quiz scores
  const { data: recentScores } = await supabase
    .from('quiz_scores')
    .select('*, quiz:quizzes(*, game:games(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Get level info
  const levelInfo = user ? await getLevelInfo(user.xp || 0) : null

  return {
    user,
    userGames: userGames || [],
    allGames: allGames || [],
    payouts: payouts || [],
    recentScores: recentScores || [],
    levelInfo,
  }
}

export default async function ProfilePage() {
  const currentUser = await requireAuth()
  const { user, userGames, allGames, payouts, recentScores, levelInfo } = await getProfileData(currentUser.id)

  if (!user) {
    return <div>User not found</div>
  }

  const selectedGameIds = userGames.map(ug => ug.game_id)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display text-white mb-8">Profile Settings</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <Avatar
                discordId={user.discord_id}
                avatarHash={user.discord_avatar}
                username={user.discord_username}
                size="xl"
                showRing
                ringColor={user.verification_status === 'verified' ? 'green' : 'gold'}
              />
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-400">@{user.discord_username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.verification_status === 'verified' ? 'success' : 'warning'}>
                    <Shield className="w-3 h-3" />
                    {user.verification_status === 'verified' ? 'Verified ZA' : user.verification_status}
                  </Badge>
                  <Badge variant="default">{user.role}</Badge>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Profile Form */}
          <ProfileForm 
            user={user} 
            allGames={allGames} 
            selectedGameIds={selectedGameIds}
          />
          
          {/* Transaction History */}
          <TransactionHistory payouts={payouts} scores={recentScores} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Level Card */}
          {levelInfo && (
            <Card className="p-6" style={{ borderColor: `${levelInfo.color}30` }}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}88)` }}
                >
                  <Star className="w-6 h-6 text-ggza-black" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Level {levelInfo.level}</div>
                  <div className="text-sm" style={{ color: levelInfo.color }}>{levelInfo.title}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">XP Progress</span>
                  <span className="text-white font-medium">
                    {user.xp?.toLocaleString() || 0} / {levelInfo.nextLevelXP?.toLocaleString() || '∞'}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${levelInfo.progress}%`,
                      backgroundColor: levelInfo.color,
                    }}
                  />
                </div>
              </div>
              
              {user.streak_days > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-400">Login Streak</span>
                    </div>
                    <span className="text-orange-400 font-bold">{user.streak_days} days</span>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ggza-gold/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-ggza-gold" />
                  </div>
                  <span className="text-gray-400">Total Wins</span>
                </div>
                <span className="text-xl font-bold text-white">{user.total_wins}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-400">Earnings</span>
                </div>
                <span className="text-xl font-bold text-green-400">{formatCurrency(user.total_earnings)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-400">Total XP</span>
                </div>
                <span className="text-xl font-bold text-purple-400">{(user.xp || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-gray-400">Member Since</span>
                </div>
                <span className="text-sm text-gray-300">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </Card>
          
          {/* Your Games */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Your Games</h3>
            <div className="space-y-2">
              {userGames.map((ug: any) => (
                <div 
                  key={ug.id}
                  className="relative flex items-center gap-3 p-2 rounded-lg overflow-hidden group"
                >
                  {/* Subtle background image */}
                  {GAME_IMAGES[ug.game?.slug] && (
                    <>
                      <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity">
                        <Image
                          src={GAME_IMAGES[ug.game?.slug]}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-ggza-black-lighter via-ggza-black-lighter/90 to-transparent" />
                    </>
                  )}
                  <div 
                    className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${ug.game?.color}25` }}
                  >
                    <span style={{ color: ug.game?.color }}>●</span>
                  </div>
                  <span className="relative text-sm text-white">{ug.game?.display_name}</span>
                  {ug.is_favorite && (
                    <Badge variant="gold" size="sm" className="relative ml-auto">Favorite</Badge>
                  )}
                </div>
              ))}
              {userGames.length === 0 && (
                <p className="text-sm text-gray-500">No games selected</p>
              )}
            </div>
          </Card>
          
          {/* Account Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile</span>
                <span className="text-white">{user.mobile || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Birth</span>
                <span className="text-white">
                  {user.date_of_birth ? formatDate(user.date_of_birth) : 'Not set'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

