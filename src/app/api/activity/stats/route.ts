import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()

    // Get total online users (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { count: totalOnline } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .gte('last_heartbeat', fiveMinutesAgo)

    // Get users in voice (status = 'in_voice')
    const { count: inVoice } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_voice')
      .gte('last_heartbeat', fiveMinutesAgo)

    // Get users in quiz
    const { count: inQuiz } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_quiz')
      .gte('last_heartbeat', fiveMinutesAgo)

    // Get per-hub activity
    const { data: hubActivity } = await supabase
      .from('user_activity')
      .select(`
        game_id,
        games!inner(slug, name, color)
      `)
      .gte('last_heartbeat', fiveMinutesAgo)
      .not('game_id', 'is', null)

    // Aggregate hub counts
    const hubCounts: Record<string, { slug: string; name: string; color: string; count: number }> = {}
    
    hubActivity?.forEach((activity: any) => {
      const game = activity.games
      if (game && game.slug) {
        if (!hubCounts[game.slug]) {
          hubCounts[game.slug] = {
            slug: game.slug,
            name: game.name,
            color: game.color,
            count: 0,
          }
        }
        hubCounts[game.slug].count++
      }
    })

    // Get all games for complete hub list
    const { data: allGames } = await supabase
      .from('games')
      .select('id, slug, name, display_name, color')
      .eq('is_active', true)
      .order('quiz_day', { ascending: true })

    const hubs = allGames?.map((game: any) => ({
      id: game.id,
      slug: game.slug,
      name: game.display_name || game.name,
      color: game.color,
      count: hubCounts[game.slug]?.count || 0,
    })) || []

    return NextResponse.json({
      totalOnline: totalOnline || 0,
      inVoice: inVoice || 0,
      inQuiz: inQuiz || 0,
      hubs,
    })
  } catch (error) {
    console.error('Activity stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

