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
  
  try {
    const body = await request.json()
    const { questionId, selectedIndex, timeMs } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Get the question and quiz_question to verify answer
    const { data: quizQuestion } = await supabase
      .from('quiz_questions')
      .select('*, question:questions(*)')
      .eq('quiz_id', params.id)
      .eq('question_id', questionId)
      .single()
    
    if (!quizQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
    
    // Check if already answered
    const { data: existingResponse } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('quiz_id', params.id)
      .eq('user_id', session.userId)
      .eq('question_id', questionId)
      .single()
    
    if (existingResponse) {
      return NextResponse.json({ 
        error: 'Already answered',
        correct: existingResponse.is_correct,
      })
    }
    
    // Determine if answer is correct
    // The shuffled_options array maps display index to original index
    // So if user selected display index 2, we need to find what original index that maps to
    const shuffledOptions = quizQuestion.shuffled_options || [0, 1, 2, 3]
    const originalSelectedIndex = selectedIndex !== null ? shuffledOptions[selectedIndex] : null
    const isCorrect = originalSelectedIndex === quizQuestion.question.correct_index
    
    // Record the response
    await supabase.from('quiz_responses').insert({
      quiz_id: params.id,
      user_id: session.userId,
      question_id: questionId,
      selected_index: selectedIndex,
      is_correct: isCorrect,
      response_time_ms: Math.min(timeMs, 5000), // Cap at 5 seconds
    })
    
    // Update question stats
    await supabase
      .from('questions')
      .update({
        times_used: quizQuestion.question.times_used + 1,
        times_correct: isCorrect 
          ? quizQuestion.question.times_correct + 1 
          : quizQuestion.question.times_correct,
      })
      .eq('id', questionId)
    
    return NextResponse.json({
      correct: isCorrect,
      correctIndex: quizQuestion.question.correct_index,
    })
    
  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}

