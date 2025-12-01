import { NextResponse } from 'next/server'
import { getDiscordOAuthUrl } from '@/lib/discord'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  // Generate state for CSRF protection
  const state = Buffer.from(JSON.stringify({
    redirect,
    nonce: Math.random().toString(36).substring(2),
  })).toString('base64')
  
  // Store state in cookie for verification
  cookies().set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  
  const authUrl = getDiscordOAuthUrl(state)
  
  return NextResponse.redirect(authUrl)
}

