import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForTokens, getDiscordUser, addUserToGuild, isUserInGuild } from '@/lib/discord'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Determine base URL from request or environment
  const url = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`
  
  // Handle Discord errors
  if (error) {
    console.error('Discord OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=discord_denied`)
  }
  
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_params`)
  }
  
  // Verify state
  const storedState = cookies().get('oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
  }
  
  // Clear state cookie
  cookies().delete('oauth_state')
  
  // Parse state to get redirect URL
  let redirect = '/dashboard'
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    redirect = stateData.redirect || '/dashboard'
  } catch {
    // Use default redirect
  }
  
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    
    // Get Discord user info
    const discordUser = await getDiscordUser(tokens.access_token)
    
    if (!discordUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=no_email`)
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordUser.id)
      .single()
    
    let user = existingUser
    
    if (existingUser) {
      // Check if existing user is still in the guild
      const inGuild = await isUserInGuild(discordUser.id)
      
      if (!inGuild) {
        // Try to re-add them to the guild
        const addedToGuild = await addUserToGuild(tokens.access_token, discordUser.id)
        
        if (!addedToGuild) {
          return NextResponse.redirect(`${baseUrl}/login?error=not_in_server`)
        }
      }
      
      // Update existing user's Discord info
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          discord_username: discordUser.username,
          discord_avatar: discordUser.avatar,
          discord_discriminator: discordUser.discriminator,
        })
        .eq('id', existingUser.id)
        .select()
        .single()
      
      user = updatedUser || existingUser
    } else {
      // New user - must be added to the Discord server
      const unverifiedRole = process.env.DISCORD_ROLE_UNVERIFIED
      const addedToGuild = await addUserToGuild(
        tokens.access_token, 
        discordUser.id, 
        unverifiedRole ? [unverifiedRole] : []
      )
      
      if (!addedToGuild) {
        // Check if they're already in the guild (joined manually)
        const inGuild = await isUserInGuild(discordUser.id)
        
        if (!inGuild) {
          return NextResponse.redirect(`${baseUrl}/login?error=not_in_server`)
        }
      }
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          discord_id: discordUser.id,
          discord_username: discordUser.username,
          discord_avatar: discordUser.avatar,
          discord_discriminator: discordUser.discriminator,
          email: discordUser.email,
          verification_status: 'pending',
          role: 'unverified',
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(`${baseUrl}/login?error=create_failed`)
      }
      
      user = newUser
      
      // New users should go to onboarding
      redirect = '/onboarding'
    }
    
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=user_not_found`)
    }
    
    // Create session
    await createSession(user)
    
    // Log the login
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_type: 'user',
      action: 'user_login',
      details: {
        method: 'discord_oauth',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    })
    
    // Redirect based on verification status
    if (user.verification_status === 'pending' && redirect !== '/onboarding') {
      redirect = '/onboarding'
    }
    
    return NextResponse.redirect(`${baseUrl}${redirect}`)
    
  } catch (error) {
    console.error('Discord callback error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`)
  }
}

