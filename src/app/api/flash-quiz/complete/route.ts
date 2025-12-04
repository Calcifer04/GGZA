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
    const { flashQuizId } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Get flash quiz
    const { data: flashQuiz } = await supabase
      .from('flash_quizzes')
      .select('*, game:games(*)')
      .eq('id', flashQuizId)
      .single()
    
    if (!flashQuiz) {
      return NextResponse.json({ error: 'Flash quiz not found' }, { status: 404 })
    }
    
    const { data: attempt } = await supabase
      .from('flash_quiz_attempts')
      .select('*')
      .eq('flash_quiz_id', flashQuizId)
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
      .from('flash_quiz_responses')
      .select('*')
      .eq('attempt_id', attempt.id)
    
    const correctCount = responses?.filter(r => r.is_correct).length || 0
    const totalTime = responses?.reduce((sum, r) => sum + r.response_time_ms, 0) || 0
    const avgTimeMs = responses && responses.length > 0 ? totalTime / responses.length : 0
    
    // Check for speed bonus
    const gotSpeedBonus = correctCount === flashQuiz.question_count && 
                          avgTimeMs <= flashQuiz.bonus_xp_threshold_ms
    
    // Calculate XP
    let xpEarned = flashQuiz.xp_reward
    if (gotSpeedBonus) {
      xpEarned += flashQuiz.bonus_xp
    }
    // Reduce XP proportionally for incorrect answers
    const accuracy = correctCount / flashQuiz.question_count
    xpEarned = Math.round(xpEarned * accuracy)
    
    // Update attempt
    await supabase
      .from('flash_quiz_attempts')
      .update({
        correct_answers: correctCount,
        total_time_ms: totalTime,
        xp_earned: xpEarned,
        bonus_earned: gotSpeedBonus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
    
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
      reason: `Flash Quiz: ${correctCount}/${flashQuiz.question_count} correct${gotSpeedBonus ? ' + Speed Bonus!' : ''}`,
      source_type: 'quiz',
      source_id: flashQuizId,
    })
    
    // Calculate next flash quiz time
    const nextFlashTime = new Date(flashQuiz.end_time)
    
    return NextResponse.json({
      success: true,
      stats: {
        correctAnswers: correctCount,
        totalQuestions: flashQuiz.question_count,
        totalTimeMs: totalTime,
        avgTimeMs: Math.round(avgTimeMs),
        xpEarned,
        gotSpeedBonus,
        accuracy: Math.round(accuracy * 100),
      },
      nextFlashAt: nextFlashTime.toISOString(),
      newTotalXp,
      newLevel: newLevel.level,
    })
    
  } catch (error) {
    console.error('Flash quiz completion error:', error)
    return NextResponse.json({ error: 'Failed to complete flash quiz' }, { status: 500 })
  }
}

