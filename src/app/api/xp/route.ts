import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { XPSourceType } from '@/types/database'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    // Get user's current XP and level
    const { data: user } = await supabase
      .from('users')
      .select('xp, level, streak_days, last_daily_claim')
      .eq('id', session.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get level thresholds
    const { data: thresholds } = await supabase
      .from('level_thresholds')
      .select('*')
      .order('level', { ascending: true })

    // Find current and next level
    const currentThreshold = thresholds?.find(t => t.level === user.level)
    const nextThreshold = thresholds?.find(t => t.level === user.level + 1)

    // Get recent XP transactions
    const { data: recentXP } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      xp: user.xp,
      level: user.level,
      streakDays: user.streak_days,
      lastDailyClaim: user.last_daily_claim,
      currentLevelXP: currentThreshold?.xp_required || 0,
      nextLevelXP: nextThreshold?.xp_required || null,
      levelTitle: currentThreshold?.title || 'Rookie',
      levelColor: currentThreshold?.badge_color || '#9CA3AF',
      recentTransactions: recentXP || [],
    })
  } catch (error) {
    console.error('XP fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, reason, sourceType, sourceId } = body as {
      amount: number
      reason: string
      sourceType: XPSourceType
      sourceId?: string
    }

    if (!amount || !reason || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Create XP transaction
    const { error: txError } = await supabase
      .from('xp_transactions')
      .insert({
        user_id: session.userId,
        amount,
        reason,
        source_type: sourceType,
        source_id: sourceId || null,
      })

    if (txError) {
      console.error('XP transaction error:', txError)
      return NextResponse.json({ error: 'Failed to record XP' }, { status: 500 })
    }

    // Update user's XP
    const { data: user, error: updateError } = await supabase.rpc('increment_user_xp', {
      p_user_id: session.userId,
      p_amount: amount,
    })

    // Fallback if RPC doesn't exist
    if (updateError) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('xp')
        .eq('id', session.userId)
        .single()

      if (currentUser) {
        await supabase
          .from('users')
          .update({ xp: currentUser.xp + amount })
          .eq('id', session.userId)
      }
    }

    // Get updated user data
    const { data: updatedUser } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', session.userId)
      .single()

    return NextResponse.json({
      success: true,
      xp: updatedUser?.xp || 0,
      level: updatedUser?.level || 1,
      gained: amount,
    })
  } catch (error) {
    console.error('XP award error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

