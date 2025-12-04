import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { calculateLevel } from '@/lib/xp'

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { challengeId } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Get challenge and attempt
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*, game:games(*)')
      .eq('id', challengeId)
      .single()
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    const { data: attempt } = await supabase
      .from('daily_challenge_attempts')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', session.userId)
      .single()
    
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }
    
    if (attempt.completed_at) {
      return NextResponse.json({ error: 'Already completed' }, { status: 400 })
    }
    
    // Get responses
    const { data: responses } = await supabase
      .from('daily_challenge_responses')
      .select('*')
      .eq('attempt_id', attempt.id)
    
    const correctCount = responses?.filter(r => r.is_correct).length || 0
    const totalTime = responses?.reduce((sum, r) => sum + r.response_time_ms, 0) || 0
    
    // Get current streak
    const { data: streak } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('game_id', challenge.game_id)
      .single()
    
    // Calculate XP with streak bonus
    const baseXp = challenge.xp_reward
    const correctBonus = correctCount * 10
    const streakMultiplier = streak?.current_streak >= 7 ? 2.0 : 
                            streak?.current_streak >= 3 ? 1.5 : 1.0
    const xpEarned = Math.round((baseXp + correctBonus) * streakMultiplier)
    
    // Update attempt
    await supabase
      .from('daily_challenge_attempts')
      .update({
        correct_answers: correctCount,
        total_time_ms: totalTime,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
    
    // The trigger will handle streak updates, but we need to manually check/create streak
    // if it doesn't exist
    if (!streak) {
      await supabase.from('user_streaks').insert({
        user_id: session.userId,
        game_id: challenge.game_id,
        current_streak: 1,
        longest_streak: 1,
        last_completed_at: new Date().toISOString(),
        total_challenges_completed: 1,
      })
    }
    
    // Award XP to user
    const { data: userData } = await supabase
      .from('users')
      .select('xp')
      .eq('id', session.userId)
      .single()
    
    const newTotalXp = (userData?.xp || 0) + xpEarned
    const newLevel = calculateLevel(newTotalXp)
    
    await supabase
      .from('users')
      .update({ 
        xp: newTotalXp,
        level: newLevel.level,
      })
      .eq('id', session.userId)
    
    // Log XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: session.userId,
      amount: xpEarned,
      reason: `Daily Challenge: ${correctCount}/${challenge.question_count} correct`,
      source_type: 'daily',
      source_id: challengeId,
    })
    
    // Get updated streak
    const { data: updatedStreak } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('game_id', challenge.game_id)
      .single()
    
    return NextResponse.json({
      success: true,
      stats: {
        correctAnswers: correctCount,
        totalQuestions: challenge.question_count,
        totalTimeMs: totalTime,
        xpEarned,
        streakMultiplier,
        accuracy: Math.round((correctCount / challenge.question_count) * 100),
      },
      streak: updatedStreak ? {
        current: updatedStreak.current_streak,
        longest: updatedStreak.longest_streak,
        total: updatedStreak.total_challenges_completed,
      } : null,
      newTotalXp,
      newLevel: newLevel.level,
    })
    
  } catch (error) {
    console.error('Daily challenge completion error:', error)
    return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 })
  }
}

