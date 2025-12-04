import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { shuffleArray } from '@/lib/utils'

// GET - Get today's daily challenge for a game
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
  
  // Get today's date in SAST (UTC+2)
  const now = new Date()
  const sastOffset = 2 * 60 * 60 * 1000
  const sastDate = new Date(now.getTime() + sastOffset)
  const today = sastDate.toISOString().split('T')[0]
  
  // Get today's challenge
  let { data: challenge } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('game_id', game.id)
    .eq('challenge_date', today)
    .eq('is_active', true)
    .single()
  
  // If no challenge exists, generate one
  if (!challenge) {
    // Generate daily challenge
    const { data: newChallenge, error: createError } = await supabase
      .from('daily_challenges')
      .insert({
        game_id: game.id,
        challenge_date: today,
        title: `${game.display_name} Daily Challenge`,
        description: 'Test your knowledge with today\'s challenge!',
        question_count: 10,
        time_per_question: 10,
        xp_reward: 100,
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating daily challenge:', createError)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }
    
    challenge = newChallenge
    
    // Get random questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('game_id', game.id)
      .eq('is_active', true)
    
    if (!questions || questions.length === 0) {
      // Delete the empty challenge if no questions available
      await supabase.from('daily_challenges').delete().eq('id', challenge.id)
      return NextResponse.json({ error: 'No questions available for this game' }, { status: 404 })
    }
    
    // Use available questions (up to 10)
    const questionCount = Math.min(questions.length, 10)
    const shuffledQuestions = shuffleArray(questions).slice(0, questionCount)
    
    for (let i = 0; i < shuffledQuestions.length; i++) {
      await supabase.from('daily_challenge_questions').insert({
        challenge_id: challenge.id,
        question_id: shuffledQuestions[i].id,
        order_index: i + 1,
        shuffled_options: shuffleArray([0, 1, 2, 3]),
      })
    }
    
    // Update challenge with actual question count
    if (questionCount < 10) {
      await supabase
        .from('daily_challenges')
        .update({ question_count: questionCount })
        .eq('id', challenge.id)
      
      challenge.question_count = questionCount
    }
  }
  
  // Check if user already attempted
  const { data: existingAttempt } = await supabase
    .from('daily_challenge_attempts')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('user_id', session.userId)
    .single()
  
  if (existingAttempt?.completed_at) {
    return NextResponse.json({
      status: 'completed',
      attempt: existingAttempt,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        xpReward: challenge.xp_reward,
      },
    })
  }
  
  // Get challenge questions
  const { data: challengeQuestions } = await supabase
    .from('daily_challenge_questions')
    .select('*, question:questions(*)')
    .eq('challenge_id', challenge.id)
    .order('order_index', { ascending: true })
  
  if (!challengeQuestions || challengeQuestions.length === 0) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 })
  }
  
  // Get user's streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', session.userId)
    .eq('game_id', game.id)
    .single()
  
  // Format questions for client
  const questions = challengeQuestions.map((cq: any) => {
    const shuffledOptions = cq.shuffled_options.map((i: number) => cq.question.options[i])
    
    return {
      id: cq.question.id,
      question_text: cq.question.question_text,
      options: shuffledOptions,
      shuffled_indices: cq.shuffled_options,
      order: cq.order_index,
      difficulty: cq.question.difficulty,
    }
  })
  
  return NextResponse.json({
    status: existingAttempt ? 'in_progress' : 'ready',
    attemptId: existingAttempt?.id || null,
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      questionCount: challenge.question_count,
      timePerQuestion: challenge.time_per_question,
      xpReward: challenge.xp_reward,
      streakBonusMultiplier: challenge.streak_bonus_multiplier,
    },
    game: {
      slug: game.slug,
      name: game.display_name,
      color: game.color,
    },
    questions,
    streak: streak ? {
      current: streak.current_streak,
      longest: streak.longest_streak,
      total: streak.total_challenges_completed,
    } : {
      current: 0,
      longest: 0,
      total: 0,
    },
  })
}

// POST - Start or submit answer for daily challenge
export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { action, challengeId, questionId, selectedIndex, shuffledIndices, timeMs } = body
    
    const supabase = createAdminSupabaseClient()
    
    if (action === 'start') {
      // Create attempt record
      const { data: attempt, error } = await supabase
        .from('daily_challenge_attempts')
        .insert({
          challenge_id: challengeId,
          user_id: session.userId,
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          return NextResponse.json({ error: 'Already attempted today' }, { status: 400 })
        }
        throw error
      }
      
      return NextResponse.json({ success: true, attemptId: attempt.id })
    }
    
    if (action === 'answer') {
      // Get user's attempt
      const { data: attempt } = await supabase
        .from('daily_challenge_attempts')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', session.userId)
        .single()
      
      if (!attempt) {
        return NextResponse.json({ error: 'No attempt found' }, { status: 404 })
      }
      
      if (attempt.completed_at) {
        return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 })
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
        .from('daily_challenge_responses')
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
      await supabase.from('daily_challenge_responses').insert({
        attempt_id: attempt.id,
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
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Daily challenge error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

