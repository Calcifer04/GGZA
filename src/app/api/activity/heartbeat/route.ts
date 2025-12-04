import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { ActivityStatus } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      gameId, 
      status = 'online', 
      currentPage,
      metadata = {} 
    } = body as {
      gameId?: string
      status?: ActivityStatus
      currentPage?: string
      metadata?: Record<string, unknown>
    }

    const supabase = createAdminSupabaseClient()

    // Build upsert data - only include game_id if explicitly provided
    const upsertData: Record<string, unknown> = {
      user_id: session.userId,
      status,
      current_page: currentPage,
      last_heartbeat: new Date().toISOString(),
      metadata,
    }
    
    // Only set game_id if explicitly provided (don't null it out otherwise)
    if (gameId !== undefined) {
      upsertData.game_id = gameId || null
    }

    // Upsert user activity
    const { data: activity, error } = await supabase
      .from('user_activity')
      .upsert(upsertData, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Activity heartbeat error:', error)
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
    }

    // Update user's last_active_at
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', session.userId)

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    // Remove user activity (mark as offline)
    await supabase
      .from('user_activity')
      .delete()
      .eq('user_id', session.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Heartbeat delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

