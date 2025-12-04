import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { shuffleArray } from '@/lib/utils'

// GET - Get current flash quiz for a game
export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const gameSlug = searchParams.get('game')
  
  if (!gameSlug) {
    return NextResponse.json({ error: 'Game slug required' }, { status: 400 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  // Get game
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('slug', gameSlug)
    .eq('is_active', true)
    .single()
  
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  
  const now = new Date().toISOString()
  
  // Get current flash quiz (within time window)
  let { data: flashQuiz } = await supabase
    .from('flash_quizzes')
    .select('*')
    .eq('game_id', game.id)
    .eq('is_active', true)
    .lte('start_time', now)
    .gte('end_time', now)
    .order('start_time', { ascending: false })
    .limit(1)
    .single()
  
  // If no current flash quiz, generate one
  if (!flashQuiz) {
    const startTime = new Date()
    // Round to current hour
    startTime.setMinutes(0, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour
    
    const { data: newFlash, error: createError } = await supabase
      .from('flash_quizzes')
      .insert({
        game_id: game.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        question_count: 5,
        time_per_question: 8,
        xp_reward: 50,
        bonus_xp_threshold_ms: 3000,
        bonus_xp: 25,
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating flash quiz:', createError)
      return NextResponse.json({ error: 'Failed to create flash quiz' }, { status: 500 })
    }
    
    flashQuiz = newFlash
    
    // Get random questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('game_id', game.id)
      .eq('is_active', true)
    
    if (!questions || questions.length === 0) {
      // Delete the empty flash quiz if no questions available
      await supabase.from('flash_quizzes').delete().eq('id', flashQuiz.id)
      return NextResponse.json({ error: 'No questions available for this game' }, { status: 404 })
    }
    
    // Use available questions (up to 5)
    const questionCount = Math.min(questions.length, 5)
    const shuffledQuestions = shuffleArray(questions).slice(0, questionCount)
    
    for (let i = 0; i < shuffledQuestions.length; i++) {
      await supabase.from('flash_quiz_questions').insert({
        flash_quiz_id: flashQuiz.id,
        question_id: shuffledQuestions[i].id,
        order_index: i + 1,
        shuffled_options: shuffleArray([0, 1, 2, 3]),
      })
    }
    
    // Update flash quiz with actual question count
    if (questionCount < 5) {
      await supabase
        .from('flash_quizzes')
        .update({ question_count: questionCount })
        .eq('id', flashQuiz.id)
      
      flashQuiz.question_count = questionCount
    }
  }
  
  // Check if user already attempted this flash quiz
  const { data: existingAttempt } = await supabase
    .from('flash_quiz_attempts')
    .select('*')
    .eq('flash_quiz_id', flashQuiz.id)
    .eq('user_id', session.userId)
    .single()
  
  if (existingAttempt?.completed_at) {
    // Calculate time until next flash quiz
    const nextFlashTime = new Date(flashQuiz.end_time)
    
    return NextResponse.json({
      status: 'completed',
      attempt: existingAttempt,
      nextFlashAt: nextFlashTime.toISOString(),
      flashQuiz: {
        id: flashQuiz.id,
        xpReward: flashQuiz.xp_reward,
        endTime: flashQuiz.end_time,
      },
    })
  }
  
  // Get flash quiz questions
  const { data: flashQuestions } = await supabase
    .from('flash_quiz_questions')
    .select('*, question:questions(*)')
    .eq('flash_quiz_id', flashQuiz.id)
    .order('order_index', { ascending: true })
  
  if (!flashQuestions || flashQuestions.length === 0) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 })
  }
  
  // Format questions for client
  const questions = flashQuestions.map((fq: any) => {
    const shuffledOptions = fq.shuffled_options.map((i: number) => fq.question.options[i])
    
    return {
      id: fq.question.id,
      question_text: fq.question.question_text,
      options: shuffledOptions,
      shuffled_indices: fq.shuffled_options,
      order: fq.order_index,
    }
  })
  
  return NextResponse.json({
    status: existingAttempt ? 'in_progress' : 'ready',
    attemptId: existingAttempt?.id || null,
    flashQuiz: {
      id: flashQuiz.id,
      questionCount: flashQuiz.question_count,
      timePerQuestion: flashQuiz.time_per_question,
      xpReward: flashQuiz.xp_reward,
      bonusXpThresholdMs: flashQuiz.bonus_xp_threshold_ms,
      bonusXp: flashQuiz.bonus_xp,
      startTime: flashQuiz.start_time,
      endTime: flashQuiz.end_time,
    },
    game: {
      slug: game.slug,
      name: game.display_name,
      color: game.color,
    },
    questions,
  })
}

// POST - Start or submit answer for flash quiz
export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { action, flashQuizId, questionId, selectedIndex, shuffledIndices, timeMs } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Verify flash quiz is still active
    const { data: flashQuiz } = await supabase
      .from('flash_quizzes')
      .select('*')
      .eq('id', flashQuizId)
      .single()
    
    if (!flashQuiz) {
      return NextResponse.json({ error: 'Flash quiz not found' }, { status: 404 })
    }
    
    const now = new Date()
    if (now > new Date(flashQuiz.end_time)) {
      return NextResponse.json({ error: 'Flash quiz has expired' }, { status: 400 })
    }
    
    if (action === 'start') {
      // Create attempt record
      const { data: attempt, error } = await supabase
        .from('flash_quiz_attempts')
        .insert({
          flash_quiz_id: flashQuizId,
          user_id: session.userId,
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Already attempted this hour' }, { status: 400 })
        }
        throw error
      }
      
      return NextResponse.json({ success: true, attemptId: attempt.id })
    }
    
    if (action === 'answer') {
      // Get user's attempt
      const { data: attempt } = await supabase
        .from('flash_quiz_attempts')
        .select('*')
        .eq('flash_quiz_id', flashQuizId)
        .eq('user_id', session.userId)
        .single()
      
      if (!attempt) {
        return NextResponse.json({ error: 'No attempt found' }, { status: 404 })
      }
      
      if (attempt.completed_at) {
        return NextResponse.json({ error: 'Quiz already completed' }, { status: 400 })
      }
      
      // Get the question
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()
      
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      
      // Check if already answered
      const { data: existingResponse } = await supabase
        .from('flash_quiz_responses')
        .select('*')
        .eq('attempt_id', attempt.id)
        .eq('question_id', questionId)
        .single()
      
      if (existingResponse) {
        return NextResponse.json({ 
          correct: existingResponse.is_correct,
          alreadyAnswered: true,
        })
      }
      
      // Determine if correct
      const originalSelectedIndex = selectedIndex !== null ? shuffledIndices[selectedIndex] : null
      const isCorrect = originalSelectedIndex === question.correct_index
      
      // Record response
      await supabase.from('flash_quiz_responses').insert({
        attempt_id: attempt.id,
        question_id: questionId,
        selected_index: selectedIndex,
        is_correct: isCorrect,
        response_time_ms: Math.min(timeMs, 8000),
      })
      
      return NextResponse.json({
        correct: isCorrect,
        correctIndex: question.correct_index,
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Flash quiz error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

