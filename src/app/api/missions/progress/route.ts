import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { RequirementType } from '@/types/database'

interface ProgressUpdate {
  requirementType: RequirementType
  value?: number
  gameId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requirementType, value = 1, gameId } = body as ProgressUpdate

    if (!requirementType) {
      return NextResponse.json({ error: 'Missing requirementType' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Get week number for weekly missions
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `week_${now.getFullYear()}_${weekNumber}`

    // Get missions that match this requirement type
    const { data: missions } = await supabase
      .from('missions')
      .select('*')
      .eq('requirement_type', requirementType)
      .eq('is_active', true)

    if (!missions || missions.length === 0) {
      return NextResponse.json({ updated: [] })
    }

    const updatedMissions: any[] = []

    for (const mission of missions) {
      // Determine period key based on mission type
      let periodKey: string
      if (mission.mission_type === 'daily') {
        periodKey = `daily_${today}`
      } else if (mission.mission_type === 'weekly') {
        periodKey = weekKey
      } else {
        periodKey = 'achievement'
      }

      // Check if game-specific mission matches
      if (mission.game_id && gameId && mission.game_id !== gameId) {
        continue
      }

      // Get or create user mission
      const { data: existingMission } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', session.userId)
        .eq('mission_id', mission.id)
        .eq('period_key', periodKey)
        .single()

      if (existingMission?.completed) {
        // Already completed, skip
        continue
      }

      const currentProgress = existingMission?.progress || 0
      const newProgress = currentProgress + value
      const isCompleted = newProgress >= mission.requirement_value

      // Upsert mission progress
      const { data: updated } = await supabase
        .from('user_missions')
        .upsert({
          user_id: session.userId,
          mission_id: mission.id,
          period_key: periodKey,
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? now.toISOString() : null,
        }, {
          onConflict: 'user_id,mission_id,period_key',
        })
        .select()
        .single()

      if (updated) {
        updatedMissions.push({
          missionId: mission.id,
          slug: mission.slug,
          title: mission.title,
          progress: newProgress,
          required: mission.requirement_value,
          completed: isCompleted,
          xpReward: mission.xp_reward,
          justCompleted: isCompleted && !existingMission?.completed,
        })
      }
    }

    return NextResponse.json({
      updated: updatedMissions,
      completedCount: updatedMissions.filter(m => m.justCompleted).length,
    })
  } catch (error) {
    console.error('Mission progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

