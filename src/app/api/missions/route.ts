import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Get week number for weekly missions
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `week_${now.getFullYear()}_${weekNumber}`

    // Get all active missions
    const { data: missions } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (!missions) {
      return NextResponse.json({ daily: [], weekly: [], achievements: [] })
    }

    // Get user's mission progress
    const { data: userMissions } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', session.userId)
      .in('period_key', [`daily_${today}`, weekKey, 'achievement'])

    // Map missions with user progress
    const missionProgress = new Map(
      userMissions?.map(um => [`${um.mission_id}_${um.period_key}`, um]) || []
    )

    const mapMission = (mission: any, periodKey: string) => {
      const userMission = missionProgress.get(`${mission.id}_${periodKey}`)
      return {
        id: mission.id,
        slug: mission.slug,
        title: mission.title,
        description: mission.description,
        xpReward: mission.xp_reward,
        icon: mission.icon,
        requirementType: mission.requirement_type,
        requirementValue: mission.requirement_value,
        progress: userMission?.progress || 0,
        completed: userMission?.completed || false,
        claimed: userMission?.claimed || false,
        completedAt: userMission?.completed_at,
      }
    }

    const daily = missions
      .filter(m => m.mission_type === 'daily')
      .map(m => mapMission(m, `daily_${today}`))

    const weekly = missions
      .filter(m => m.mission_type === 'weekly')
      .map(m => mapMission(m, weekKey))

    const achievements = missions
      .filter(m => m.mission_type === 'achievement')
      .map(m => mapMission(m, 'achievement'))

    return NextResponse.json({
      daily,
      weekly,
      achievements,
      periodKeys: {
        daily: `daily_${today}`,
        weekly: weekKey,
      },
    })
  } catch (error) {
    console.error('Missions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

