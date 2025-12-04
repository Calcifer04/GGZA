import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch leaderboard
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    const session = await getSession()

    // Get top 10 best scores with user info
    const { data: leaderboard, error } = await supabase
      .from('reaction_best_scores')
      .select(`
        id,
        best_time_ms,
        attempts,
        updated_at,
        user:users(id, discord_id, discord_username, discord_avatar, first_name)
      `)
      .order('best_time_ms', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Leaderboard fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Get current user's best score and rank if logged in
    let userScore = null
    let userRank = null

    if (session) {
      const { data: userBest } = await supabase
        .from('reaction_best_scores')
        .select('*')
        .eq('user_id', session.userId)
        .single()

      if (userBest) {
        userScore = userBest

        // Calculate rank
        const { count } = await supabase
          .from('reaction_best_scores')
          .select('*', { count: 'exact', head: true })
          .lt('best_time_ms', userBest.best_time_ms)

        userRank = (count || 0) + 1
      }
    }

    // Get total players
    const { count: totalPlayers } = await supabase
      .from('reaction_best_scores')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      leaderboard: leaderboard?.map((entry: any, index: number) => ({
        rank: index + 1,
        username: entry.user?.first_name || entry.user?.discord_username || 'Unknown',
        discordUsername: entry.user?.discord_username,
        discordAvatar: entry.user?.discord_avatar,
        discordId: entry.user?.discord_id,
        time: entry.best_time_ms,
        attempts: entry.attempts,
      })) || [],
      userScore: userScore ? {
        bestTime: userScore.best_time_ms,
        attempts: userScore.attempts,
        rank: userRank,
      } : null,
      totalPlayers: totalPlayers || 0,
    })
  } catch (error) {
    console.error('Reaction leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit a new score
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { timeMs } = body as { timeMs: number }

    // Validate the time
    if (!timeMs || typeof timeMs !== 'number' || timeMs < 100 || timeMs > 10000) {
      return NextResponse.json({ error: 'Invalid reaction time' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Insert the score (trigger will update best_scores table)
    const { error: insertError } = await supabase
      .from('reaction_scores')
      .insert({
        user_id: session.userId,
        time_ms: Math.round(timeMs),
      })

    if (insertError) {
      console.error('Score insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
    }

    // Get updated user stats
    const { data: userBest } = await supabase
      .from('reaction_best_scores')
      .select('*')
      .eq('user_id', session.userId)
      .single()

    // Calculate new rank
    let rank = null
    if (userBest) {
      const { count } = await supabase
        .from('reaction_best_scores')
        .select('*', { count: 'exact', head: true })
        .lt('best_time_ms', userBest.best_time_ms)

      rank = (count || 0) + 1
    }

    // Check if this was a new personal best
    const isNewBest = userBest?.best_time_ms === Math.round(timeMs)

    return NextResponse.json({
      success: true,
      isNewBest,
      bestTime: userBest?.best_time_ms,
      attempts: userBest?.attempts,
      rank,
    })
  } catch (error) {
    console.error('Reaction score submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

