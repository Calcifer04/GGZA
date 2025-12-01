import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedRoutes = ['/dashboard', '/profile', '/quiz', '/hub', '/admin']
const authRoutes = ['/login']
const verifiedRoutes = ['/quiz', '/hub']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  const sessionCookie = request.cookies.get('ggza_session')
  let session = null

  if (sessionCookie?.value) {
    try {
      session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    } catch {
      // Invalid session
    }
  }

  const isAuthenticated = !!session
  const isVerified = session?.isVerified ?? false
  const isAdmin = ['admin', 'community_manager', 'quiz_master', 'bot_dev', 'moderator'].includes(session?.role ?? '')

  if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && !isVerified && verifiedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (isAuthenticated && !isAdmin && adminRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

