import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { shuffleArray } from '@/lib/utils'

// GET - Start a new practice session
export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const gameSlug = searchParams.get('game')
  const questionCount = Math.min(parseInt(searchParams.get('count') || '10'), 30)
  
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
  
  // Get all questions for this game and randomly select
  const { data: allQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('game_id', game.id)
    .eq('is_active', true)
  
  if (questionsError) {
    console.error('Questions query error:', questionsError)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
  
  if (!allQuestions || allQuestions.length === 0) {
    return NextResponse.json({ error: 'No questions available for this game' }, { status: 404 })
  }
  
  // Shuffle and pick requested number
  const questions = shuffleArray(allQuestions).slice(0, questionCount)
  
  // Create practice session
  const { data: practiceSession, error: sessionError } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: session.userId,
      game_id: game.id,
      question_count: questions.length,
    })
    .select()
    .single()
  
  if (sessionError) {
    console.error('Error creating practice session:', sessionError)
    return NextResponse.json({ error: 'Failed to start practice session' }, { status: 500 })
  }
  
  // Format questions for client (hide correct answers, shuffle options)
  const formattedQuestions = questions.map((q, index) => {
    const shuffledIndices = shuffleArray([0, 1, 2, 3])
    const shuffledOptions = shuffledIndices.map((i: number) => q.options[i])
    
    return {
      id: q.id,
      question_text: q.question_text,
      options: shuffledOptions,
      shuffled_indices: shuffledIndices,
      order: index + 1,
      difficulty: q.difficulty,
    }
  })
  
  return NextResponse.json({
    sessionId: practiceSession.id,
    game: {
      slug: game.slug,
      name: game.display_name,
      color: game.color,
    },
    questions: formattedQuestions,
    timePerQuestion: 10, // More relaxed for practice
    xpPerCorrect: 5,
    xpCompletionBonus: 25,
  })
}

// POST - Submit practice answer
export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { sessionId, questionId, selectedIndex, shuffledIndices, timeMs } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Verify session belongs to user
    const { data: practiceSession } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.userId)
      .single()
    
    if (!practiceSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
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
      .from('practice_responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .single()
    
    if (existingResponse) {
      return NextResponse.json({ 
        error: 'Already answered',
        correct: existingResponse.is_correct,
      })
    }
    
    // Determine if correct (map shuffled index back to original)
    const originalSelectedIndex = selectedIndex !== null ? shuffledIndices[selectedIndex] : null
    const isCorrect = originalSelectedIndex === question.correct_index
    
    // Record response
    await supabase.from('practice_responses').insert({
      session_id: sessionId,
      question_id: questionId,
      selected_index: selectedIndex,
      is_correct: isCorrect,
      response_time_ms: Math.min(timeMs, 10000),
    })
    
    // Update question stats
    await supabase
      .from('questions')
      .update({
        times_used: question.times_used + 1,
        times_correct: isCorrect ? question.times_correct + 1 : question.times_correct,
      })
      .eq('id', questionId)
    
    return NextResponse.json({
      correct: isCorrect,
      correctIndex: question.correct_index,
      explanation: question.explanation || null,
    })
    
  } catch (error) {
    console.error('Practice answer error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}

