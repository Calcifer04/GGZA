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
    const { sessionId } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Get session with responses
    const { data: practiceSession } = await supabase
      .from('practice_sessions')
      .select('*, game:games(*)')
      .eq('id', sessionId)
      .eq('user_id', session.userId)
      .single()
    
    if (!practiceSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    if (practiceSession.completed_at) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }
    
    // Get all responses for this session
    const { data: responses } = await supabase
      .from('practice_responses')
      .select('*')
      .eq('session_id', sessionId)
    
    const correctCount = responses?.filter(r => r.is_correct).length || 0
    const totalTime = responses?.reduce((sum, r) => sum + r.response_time_ms, 0) || 0
    
    // Calculate XP
    const xpPerCorrect = 5
    const xpCompletionBonus = 25
    const xpEarned = (correctCount * xpPerCorrect) + xpCompletionBonus
    
    // Update practice session
    await supabase
      .from('practice_sessions')
      .update({
        correct_answers: correctCount,
        total_time_ms: totalTime,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
    
    const accuracy = practiceSession.question_count > 0 
      ? (correctCount / practiceSession.question_count) * 100 
      : 0
    
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
      reason: `Practice session: ${correctCount}/${practiceSession.question_count} correct`,
      source_type: 'quiz',
      source_id: sessionId,
    })
    
    return NextResponse.json({
      success: true,
      stats: {
        correctAnswers: correctCount,
        totalQuestions: practiceSession.question_count,
        totalTimeMs: totalTime,
        xpEarned,
        accuracy: Math.round(accuracy),
      },
      newTotalXp,
      newLevel: newLevel.level,
    })
    
  } catch (error) {
    console.error('Practice completion error:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}

