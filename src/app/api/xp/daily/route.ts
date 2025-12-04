import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

const DAILY_XP = 15
const STREAK_BONUS_PER_DAY = 5
const MAX_STREAK_BONUS = 50 // Max bonus at 10 day streak

export async function POST() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    // Get user's current streak info
    const { data: user } = await supabase
      .from('users')
      .select('xp, level, streak_days, last_daily_claim')
      .eq('id', session.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim) : null
    const lastClaimDate = lastClaim?.toISOString().split('T')[0]

    // Check if already claimed today
    if (lastClaimDate === today) {
      return NextResponse.json({ 
        error: 'Already claimed today',
        nextClaimAt: new Date(now.setDate(now.getDate() + 1)).setHours(0, 0, 0, 0),
      }, { status: 400 })
    }

    // Calculate streak
    let newStreak = 1
    if (lastClaim) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (lastClaimDate === yesterdayStr) {
        // Consecutive day - increase streak
        newStreak = user.streak_days + 1
      }
      // Otherwise reset to 1 (already set)
    }

    // Calculate total XP (base + streak bonus)
    const streakBonus = Math.min(newStreak * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS)
    const totalXP = DAILY_XP + streakBonus

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        xp: user.xp + totalXP,
        streak_days: newStreak,
        last_daily_claim: now.toISOString(),
      })
      .eq('id', session.userId)

    if (updateError) {
      console.error('Daily claim update error:', updateError)
      return NextResponse.json({ error: 'Failed to claim daily' }, { status: 500 })
    }

    // Record XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: session.userId,
      amount: totalXP,
      reason: `Daily reward (${newStreak} day streak)`,
      source_type: 'daily',
    })

    // Update daily mission progress
    const periodKey = `daily_${today}`
    await supabase.from('user_missions').upsert({
      user_id: session.userId,
      mission_id: (await supabase
        .from('missions')
        .select('id')
        .eq('slug', 'daily_claim')
        .single()).data?.id,
      progress: 1,
      completed: true,
      completed_at: now.toISOString(),
      period_key: periodKey,
    }, {
      onConflict: 'user_id,mission_id,period_key',
    })

    // Get updated user for level check
    const { data: updatedUser } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', session.userId)
      .single()

    return NextResponse.json({
      success: true,
      xpGained: totalXP,
      baseXP: DAILY_XP,
      streakBonus,
      newStreak,
      totalXP: updatedUser?.xp || 0,
      level: updatedUser?.level || 1,
    })
  } catch (error) {
    console.error('Daily claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('streak_days, last_daily_claim')
      .eq('id', session.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim) : null
    const lastClaimDate = lastClaim?.toISOString().split('T')[0]
    
    const canClaim = lastClaimDate !== today

    // Calculate potential reward
    let potentialStreak = user.streak_days
    if (canClaim && lastClaim) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (lastClaimDate === yesterdayStr) {
        potentialStreak = user.streak_days + 1
      } else {
        potentialStreak = 1
      }
    }

    const potentialBonus = Math.min(potentialStreak * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS)
    const potentialXP = DAILY_XP + potentialBonus

    return NextResponse.json({
      canClaim,
      currentStreak: user.streak_days,
      potentialStreak: canClaim ? potentialStreak : user.streak_days,
      potentialXP: canClaim ? potentialXP : 0,
      lastClaim: user.last_daily_claim,
    })
  } catch (error) {
    console.error('Daily status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

