import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { shuffleArray } from '@/lib/utils'

// GET - Get questions for a quiz
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  const { data: quizQuestions } = await supabase
    .from('quiz_questions')
    .select('*, question:questions(*)')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })
  
  return NextResponse.json({ questions: quizQuestions || [] })
}

// POST - Add questions to quiz
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
    const { action, questionIds, autoSelect, count, difficulty } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Get quiz
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    
    if (quiz.status !== 'scheduled') {
      return NextResponse.json({ error: 'Cannot modify questions of a started quiz' }, { status: 400 })
    }
    
    // Get current question count
    const { count: currentCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', params.id)
    
    if (action === 'auto-select') {
      // Auto-select random questions
      const selectCount = count || quiz.question_count
      
      // Get questions not already in quiz
      let query = supabase
        .from('questions')
        .select('id')
        .eq('game_id', quiz.game_id)
        .eq('is_active', true)
      
      if (difficulty && difficulty !== 'any') {
        query = query.eq('difficulty', difficulty)
      }
      
      const { data: availableQuestions } = await query
      
      if (!availableQuestions || availableQuestions.length === 0) {
        return NextResponse.json({ error: 'No questions available' }, { status: 400 })
      }
      
      // Get already added question IDs
      const { data: existingQQ } = await supabase
        .from('quiz_questions')
        .select('question_id')
        .eq('quiz_id', params.id)
      
      const existingIds = new Set(existingQQ?.map(q => q.question_id) || [])
      const newQuestions = availableQuestions.filter(q => !existingIds.has(q.id))
      
      if (newQuestions.length === 0) {
        return NextResponse.json({ error: 'All available questions already added' }, { status: 400 })
      }
      
      // Shuffle and select
      const shuffled = shuffleArray(newQuestions)
      const selected = shuffled.slice(0, selectCount - (currentCount || 0))
      
      // Add to quiz
      const toInsert = selected.map((q, index) => ({
        quiz_id: params.id,
        question_id: q.id,
        order_index: (currentCount || 0) + index + 1,
        shuffled_options: shuffleArray([0, 1, 2, 3]),
      }))
      
      const { error } = await supabase
        .from('quiz_questions')
        .insert(toInsert)
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({ 
        success: true, 
        added: selected.length,
        total: (currentCount || 0) + selected.length,
      })
    }
    
    if (action === 'add' && questionIds) {
      // Add specific questions
      const toInsert = questionIds.map((qId: string, index: number) => ({
        quiz_id: params.id,
        question_id: qId,
        order_index: (currentCount || 0) + index + 1,
        shuffled_options: shuffleArray([0, 1, 2, 3]),
      }))
      
      const { error } = await supabase
        .from('quiz_questions')
        .insert(toInsert)
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Some questions already in quiz' }, { status: 400 })
        }
        throw error
      }
      
      return NextResponse.json({ 
        success: true, 
        added: questionIds.length,
        total: (currentCount || 0) + questionIds.length,
      })
    }
    
    if (action === 'remove' && questionIds) {
      // Remove questions
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', params.id)
        .in('question_id', questionIds)
      
      if (error) {
        throw error
      }
      
      // Reorder remaining questions
      const { data: remaining } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('quiz_id', params.id)
        .order('order_index', { ascending: true })
      
      if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
          await supabase
            .from('quiz_questions')
            .update({ order_index: i + 1 })
            .eq('id', remaining[i].id)
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        removed: questionIds.length,
        total: remaining?.length || 0,
      })
    }
    
    if (action === 'clear') {
      // Remove all questions
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', params.id)
      
      return NextResponse.json({ success: true, total: 0 })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Quiz questions error:', error)
    return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 })
  }
}

