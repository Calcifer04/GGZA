import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { missionId, periodKey } = body as {
      missionId: string
      periodKey: string
    }

    if (!missionId || !periodKey) {
      return NextResponse.json({ error: 'Missing missionId or periodKey' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Get the user mission
    const { data: userMission } = await supabase
      .from('user_missions')
      .select('*, mission:missions(*)')
      .eq('user_id', session.userId)
      .eq('mission_id', missionId)
      .eq('period_key', periodKey)
      .single()

    if (!userMission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    if (!userMission.completed) {
      return NextResponse.json({ error: 'Mission not completed' }, { status: 400 })
    }

    if (userMission.claimed) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }

    const xpReward = (userMission.mission as any)?.xp_reward || 0
    const now = new Date().toISOString()

    // Mark as claimed
    await supabase
      .from('user_missions')
      .update({
        claimed: true,
        claimed_at: now,
      })
      .eq('id', userMission.id)

    // Award XP
    const { data: user } = await supabase
      .from('users')
      .select('xp')
      .eq('id', session.userId)
      .single()

    if (user) {
      await supabase
        .from('users')
        .update({ xp: user.xp + xpReward })
        .eq('id', session.userId)

      // Record XP transaction
      await supabase.from('xp_transactions').insert({
        user_id: session.userId,
        amount: xpReward,
        reason: `Mission: ${(userMission.mission as any)?.title}`,
        source_type: 'mission',
        source_id: missionId,
      })
    }

    // Get updated user
    const { data: updatedUser } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', session.userId)
      .single()

    return NextResponse.json({
      success: true,
      xpGained: xpReward,
      totalXP: updatedUser?.xp || 0,
      level: updatedUser?.level || 1,
    })
  } catch (error) {
    console.error('Mission claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

