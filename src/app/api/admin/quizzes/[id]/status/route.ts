import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if user is admin
  const allowedRoles = ['admin', 'community_manager', 'quiz_master']
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    const { status } = body
    
    if (!['scheduled', 'live', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Get current quiz
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    
    // Validate status transitions
    if (quiz.status === 'completed' || quiz.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot change status of completed/cancelled quiz' }, { status: 400 })
    }
    
    if (status === 'live') {
      // Check if quiz has enough questions
      const { count } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', params.id)
      
      if (!count || count < quiz.question_count) {
        return NextResponse.json({ 
          error: `Quiz needs ${quiz.question_count} questions but only has ${count || 0}` 
        }, { status: 400 })
      }
    }
    
    // Update timestamp fields based on status
    const updates: Record<string, any> = { status }
    
    if (status === 'live') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.ended_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', params.id)
    
    if (error) {
      throw error
    }
    
    // If completing quiz, calculate scores
    if (status === 'completed') {
      await calculateQuizScores(supabase, params.id, quiz)
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: `quiz_status_${status}`,
      target_type: 'quiz',
      target_id: params.id,
      details: { previous_status: quiz.status },
    })
    
    return NextResponse.json({ success: true, status })
    
  } catch (error) {
    console.error('Quiz status update error:', error)
    return NextResponse.json({ error: 'Failed to update quiz status' }, { status: 500 })
  }
}

async function calculateQuizScores(supabase: any, quizId: string, quiz: any) {
  // Get all responses grouped by user
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('user_id, is_correct, response_time_ms')
    .eq('quiz_id', quizId)
  
  if (!responses || responses.length === 0) return
  
  // Group by user
  const userScores: Record<string, { correct: number; totalTime: number; responses: number }> = {}
  
  for (const response of responses) {
    if (!userScores[response.user_id]) {
      userScores[response.user_id] = { correct: 0, totalTime: 0, responses: 0 }
    }
    if (response.is_correct) {
      userScores[response.user_id].correct++
    }
    userScores[response.user_id].totalTime += response.response_time_ms
    userScores[response.user_id].responses++
  }
  
  // Create score records
  const scores = Object.entries(userScores).map(([userId, data]) => ({
    quiz_id: quizId,
    user_id: userId,
    total_points: data.correct * (quiz.points_per_correct || 10),
    correct_answers: data.correct,
    total_questions: quiz.question_count,
    total_time_ms: data.totalTime,
  }))
  
  // Insert scores
  await supabase.from('quiz_scores').upsert(scores, { 
    onConflict: 'quiz_id,user_id' 
  })
  
  // Update ranks
  const { data: rankedScores } = await supabase
    .from('quiz_scores')
    .select('id, total_points, total_time_ms')
    .eq('quiz_id', quizId)
    .order('total_points', { ascending: false })
    .order('total_time_ms', { ascending: true })
  
  if (rankedScores) {
    for (let i = 0; i < rankedScores.length; i++) {
      await supabase
        .from('quiz_scores')
        .update({ rank: i + 1 })
        .eq('id', rankedScores[i].id)
    }
  }
  
  // Update leaderboards (weekly)
  for (const [userId, data] of Object.entries(userScores)) {
    const points = data.correct * (quiz.points_per_correct || 10)
    
    // Get current week key
    const weekKey = `${quiz.year}-W${String(quiz.week_number).padStart(2, '0')}`
    
    // Upsert to leaderboard
    const { data: existing } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('game_id', quiz.game_id)
      .eq('user_id', userId)
      .eq('period_type', 'weekly')
      .eq('period_key', weekKey)
      .single()
    
    if (existing) {
      // Update with best 2 scores logic
      const bestScores = existing.best_two_scores || []
      bestScores.push(points)
      bestScores.sort((a: number, b: number) => b - a)
      const topTwo = bestScores.slice(0, 2)
      
      await supabase
        .from('leaderboards')
        .update({
          total_points: topTwo.reduce((a: number, b: number) => a + b, 0),
          best_score: Math.max(existing.best_score || 0, points),
          quizzes_played: existing.quizzes_played + 1,
          best_two_scores: topTwo,
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('leaderboards')
        .insert({
          game_id: quiz.game_id,
          user_id: userId,
          period_type: 'weekly',
          period_key: weekKey,
          total_points: points,
          best_score: points,
          quizzes_played: 1,
          best_two_scores: [points],
        })
    }
  }
}

