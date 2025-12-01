import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

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
    const { gameId, questionText, options, correctIndex, difficulty, category } = body
    
    // Validate
    if (!gameId || !questionText || !options || options.length !== 4) {
      return NextResponse.json({ error: 'Invalid question data' }, { status: 400 })
    }
    
    if (correctIndex < 0 || correctIndex > 3) {
      return NextResponse.json({ error: 'Invalid correct answer index' }, { status: 400 })
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Create question
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        game_id: gameId,
        question_text: questionText,
        options: options,
        correct_index: correctIndex,
        difficulty: difficulty || 'medium',
        category: category || null,
        is_active: true,
        created_by: session.userId,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: 'question_created',
      target_type: 'question',
      target_id: question.id,
      details: { game_id: gameId },
    })
    
    return NextResponse.json({ success: true, question })
    
  } catch (error) {
    console.error('Question creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

