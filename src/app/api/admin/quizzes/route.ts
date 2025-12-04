import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

// POST - Create new quiz
export async function POST(request: Request) {
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
    const { 
      gameId, 
      title, 
      description, 
      scheduledAt, 
      questionCount,
      timePerQuestion,
      prizePool,
      weekNumber,
      year,
      isMonthlyFinal,
    } = body
    
    // Validate
    if (!gameId || !title || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Check if quiz already exists for this game/week/year
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('game_id', gameId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single()
    
    if (existingQuiz) {
      return NextResponse.json({ 
        error: `A quiz already exists for this game in week ${weekNumber}, ${year}` 
      }, { status: 400 })
    }
    
    // Create quiz
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        game_id: gameId,
        title,
        description: description || null,
        status: 'scheduled',
        scheduled_at: new Date(scheduledAt).toISOString(),
        question_count: questionCount || 30,
        time_per_question: timePerQuestion || 5,
        prize_pool: prizePool || 1000,
        week_number: weekNumber,
        year: year,
        is_monthly_final: isMonthlyFinal || false,
        created_by: session.userId,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating quiz:', error)
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: 'quiz_created',
      target_type: 'quiz',
      target_id: quiz.id,
      details: { game_id: gameId, title, week_number: weekNumber },
    })
    
    return NextResponse.json({ success: true, quiz })
    
  } catch (error) {
    console.error('Quiz creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List quizzes
export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const status = searchParams.get('status')
  
  const supabase = createAdminSupabaseClient()
  
  let query = supabase
    .from('quizzes')
    .select('*, game:games(*)')
    .order('scheduled_at', { ascending: false })
  
  if (gameId) {
    query = query.eq('game_id', gameId)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data: quizzes, error } = await query.limit(50)
  
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
  
  return NextResponse.json({ quizzes })
}

