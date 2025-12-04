import { NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

// DEV ONLY - Direct login without Discord OAuth
// This should be removed or disabled in production!
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  
  const { searchParams } = new URL(request.url)
  const discordId = searchParams.get('discord_id')
  const email = searchParams.get('email')
  
  if (!discordId && !email) {
    return NextResponse.json({ 
      error: 'Provide discord_id or email as query param',
      usage: '/api/auth/dev-login?discord_id=YOUR_DISCORD_ID or /api/auth/dev-login?email=YOUR_EMAIL'
    }, { status: 400 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  // Find user
  let query = supabase.from('users').select('*')
  
  if (discordId) {
    query = query.eq('discord_id', discordId)
  } else if (email) {
    query = query.eq('email', email)
  }
  
  const { data: user, error } = await query.single()
  
  if (error || !user) {
    return NextResponse.json({ 
      error: 'User not found',
      hint: 'Make sure the discord_id or email exists in your users table'
    }, { status: 404 })
  }
  
  // Create session
  await createSession(user)
  
  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

