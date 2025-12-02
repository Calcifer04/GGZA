import { NextResponse } from 'next/server'
import { destroySession, getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const session = await getSession()
  
  if (session) {
    const supabase = createAdminSupabaseClient()
    
    // Log the logout
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: 'user_logout',
      details: {},
    })
  }
  
  await destroySession()
  
  const baseUrl = 'https://ggza-mauve.vercel.app'
  return NextResponse.redirect(`${baseUrl}/`)
}

export async function GET() {
  await destroySession()
  
  const baseUrl = 'https://ggza-mauve.vercel.app'
  return NextResponse.redirect(`${baseUrl}/`)
}

