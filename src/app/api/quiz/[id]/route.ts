import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { shuffleArray } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  // Get quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*, game:games(*)')
    .eq('id', params.id)
    .single()
  
  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }
  
  // Check if user already completed this quiz
  const { data: existingScore } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('quiz_id', params.id)
    .eq('user_id', session.userId)
    .single()
  
  if (existingScore) {
    return NextResponse.json({
      status: 'completed',
      score: existingScore,
    })
  }
  
  // If quiz is not live yet
  if (quiz.status === 'scheduled') {
    return NextResponse.json({
      status: 'scheduled',
      scheduled_at: quiz.scheduled_at,
      gameSlug: quiz.game?.slug,
    })
  }
  
  // If quiz is completed
  if (quiz.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
    })
  }
  
  // Get quiz questions (already assigned to this quiz)
  const { data: quizQuestions } = await supabase
    .from('quiz_questions')
    .select('*, question:questions(*)')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })
  
  if (!quizQuestions || quizQuestions.length === 0) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 })
  }
  
  // Format questions for client (hide correct answers)
  const questions = quizQuestions.map((qq: any) => {
    const shuffledIndices = qq.shuffled_options || shuffleArray([0, 1, 2, 3])
    const shuffledOptions = shuffledIndices.map((i: number) => qq.question.options[i])
    
    return {
      id: qq.question.id,
      question_text: qq.question.question_text,
      options: shuffledOptions,
      shuffled_indices: shuffledIndices,
      time_limit: quiz.time_per_question,
    }
  })
  
  return NextResponse.json({
    status: quiz.status,
    questions,
    gameSlug: quiz.game?.slug,
    timePerQuestion: quiz.time_per_question,
    pointsPerCorrect: quiz.points_per_correct,
  })
}

