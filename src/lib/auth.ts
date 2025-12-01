import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from './supabase/server'
import type { User, UserRole } from '@/types/database'

const SESSION_COOKIE = 'ggza_session'

export interface Session {
  userId: string
  discordId: string
  discordUsername: string
  discordAvatar: string | null
  role: UserRole
  isVerified: boolean
  expiresAt: number
}

export async function createSession(user: User): Promise<string> {
  const session: Session = {
    userId: user.id,
    discordId: user.discord_id,
    discordUsername: user.discord_username,
    discordAvatar: user.discord_avatar,
    role: user.role,
    isVerified: user.verification_status === 'verified' || 
                user.verification_status === 'kyc_verified',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }

  const sessionData = Buffer.from(JSON.stringify(session)).toString('base64')
  
  cookies().set(SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return sessionData
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session: Session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    if (session.expiresAt < Date.now()) {
      await destroySession()
      return null
    }

    return session
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE)
}

export async function getUser(): Promise<User | null> {
  const session = await getSession()
  
  if (!session) {
    return null
  }

  const supabase = createAdminSupabaseClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .single()

  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireVerified(): Promise<User> {
  const user = await requireAuth()
  
  if (user.verification_status !== 'verified' && user.verification_status !== 'kyc_verified') {
    redirect('/onboarding')
  }

  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  return requireRole(['admin', 'community_manager', 'quiz_master', 'moderator'])
}

export function isAdmin(user: User): boolean {
  return ['admin', 'community_manager', 'quiz_master', 'bot_dev', 'moderator'].includes(user.role)
}

export function canManageQuizzes(user: User): boolean {
  return ['admin', 'community_manager', 'quiz_master'].includes(user.role)
}

export function canManagePayouts(user: User): boolean {
  return ['admin', 'community_manager'].includes(user.role)
}

export function canModerate(user: User): boolean {
  return ['admin', 'community_manager', 'moderator'].includes(user.role)
}

export async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string; expiresAt?: string }> {
  const supabase = createAdminSupabaseClient()
  
  const { data: strikes } = await supabase
    .from('strikes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('type', ['ban_7day', 'ban_season', 'ban_permanent'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (strikes && strikes.length > 0) {
    const strike = strikes[0]
    
    if (strike.expires_at && new Date(strike.expires_at) < new Date()) {
      await supabase
        .from('strikes')
        .update({ is_active: false })
        .eq('id', strike.id)
      
      return { banned: false }
    }

    return {
      banned: true,
      reason: strike.reason,
      expiresAt: strike.expires_at || undefined,
    }
  }

  return { banned: false }
}

