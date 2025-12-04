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
  
  const supabase = createAdminSupabaseClient()
  
  // Get quiz details
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }
  
  // Check if score already exists
  const { data: existingScore } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('quiz_id', params.id)
    .eq('user_id', session.userId)
    .single()
  
  if (existingScore) {
    return NextResponse.json({ 
      success: true, 
      score: existingScore,
      message: 'Score already recorded'
    })
  }
  
  // Get user's responses
  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('quiz_id', params.id)
    .eq('user_id', session.userId)
  
  if (!responses || responses.length === 0) {
    return NextResponse.json({ error: 'No responses found' }, { status: 400 })
  }
  
  // Calculate score
  const correctCount = responses.filter(r => r.is_correct).length
  const totalTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0)
  const pointsPerCorrect = quiz.points_per_correct || 10
  const totalPoints = correctCount * pointsPerCorrect
  
  // Insert score
  const { data: score, error: insertError } = await supabase
    .from('quiz_scores')
    .insert({
      quiz_id: params.id,
      user_id: session.userId,
      total_points: totalPoints,
      correct_answers: correctCount,
      total_questions: quiz.question_count,
      total_time_ms: totalTime,
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('Error inserting score:', insertError)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
  
  // Update weekly leaderboard
  const weekKey = `${quiz.year}-W${String(quiz.week_number).padStart(2, '0')}`
  
  const { data: existingLeaderboard } = await supabase
    .from('leaderboards')
    .select('*')
    .eq('game_id', quiz.game_id)
    .eq('user_id', session.userId)
    .eq('period_type', 'weekly')
    .eq('period_key', weekKey)
    .single()
  
  if (existingLeaderboard) {
    // Update with best 2 scores logic
    const bestScores = existingLeaderboard.best_two_scores || []
    bestScores.push(totalPoints)
    bestScores.sort((a: number, b: number) => b - a)
    const topTwo = bestScores.slice(0, 2)
    
    await supabase
      .from('leaderboards')
      .update({
        total_points: topTwo.reduce((a: number, b: number) => a + b, 0),
        best_score: Math.max(existingLeaderboard.best_score || 0, totalPoints),
        quizzes_played: existingLeaderboard.quizzes_played + 1,
        best_two_scores: topTwo,
        average_time_ms: Math.round(
          ((existingLeaderboard.average_time_ms || 0) * existingLeaderboard.quizzes_played + totalTime) / 
          (existingLeaderboard.quizzes_played + 1)
        ),
      })
      .eq('id', existingLeaderboard.id)
  } else {
    await supabase
      .from('leaderboards')
      .insert({
        game_id: quiz.game_id,
        user_id: session.userId,
        period_type: 'weekly',
        period_key: weekKey,
        total_points: totalPoints,
        best_score: totalPoints,
        quizzes_played: 1,
        best_two_scores: [totalPoints],
        average_time_ms: totalTime,
      })
  }
  
  // Log completion
  await supabase.from('audit_logs').insert({
    actor_id: session.userId,
    actor_type: 'user',
    action: 'quiz_completed',
    target_type: 'quiz',
    target_id: params.id,
    details: {
      total_points: totalPoints,
      correct_answers: correctCount,
      total_time_ms: totalTime,
    },
  })
  
  return NextResponse.json({ 
    success: true, 
    score: {
      total_points: totalPoints,
      correct_answers: correctCount,
      total_questions: quiz.question_count,
      total_time_ms: totalTime,
    }
  })
}

