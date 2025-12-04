import { NextResponse } from 'next/server'
import { getSession, createSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

// GET - Refresh session with latest user data from database
export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  // Get fresh user data from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .single()
  
  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  // Create new session with updated data
  await createSession(user)
  
  return NextResponse.json({ 
    success: true, 
    message: 'Session refreshed',
    user: {
      id: user.id,
      username: user.discord_username,
      role: user.role,
      isVerified: user.verification_status === 'verified' || user.verification_status === 'kyc_verified',
    }
  })
}

