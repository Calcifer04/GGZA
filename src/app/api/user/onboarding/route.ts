import { NextResponse } from 'next/server'
import { getSession, createSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { syncUserRoles } from '@/lib/discord'
import { calculateAge } from '@/lib/utils'

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      mobile,
      dateOfBirth,
      selectedGames,
      tosAccepted,
      popiaAccepted,
      newsletterOptIn,
      whatsappOptIn,
      challengeAnswer,
    } = body
    
    // Validate required fields
    if (!firstName || !lastName || !mobile || !dateOfBirth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (!tosAccepted || !popiaAccepted) {
      return NextResponse.json({ error: 'You must accept the terms' }, { status: 400 })
    }
    
    if (!selectedGames || selectedGames.length === 0) {
      return NextResponse.json({ error: 'Select at least one game' }, { status: 400 })
    }
    
    // Validate age
    const age = calculateAge(dateOfBirth)
    if (age < 18) {
      return NextResponse.json({ error: 'You must be 18+ to participate' }, { status: 400 })
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Get the challenge question and verify answer
    const { data: challenges } = await supabase
      .from('sa_challenges')
      .select('*')
      .eq('is_active', true)
      .limit(1)
    
    const challenge = challenges?.[0]
    const challengePassed = challenge ? challengeAnswer === challenge.correct_index : true
    
    if (!challengePassed) {
      return NextResponse.json({ error: 'SA verification failed' }, { status: 400 })
    }
    
    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        mobile,
        date_of_birth: dateOfBirth,
        is_18_plus: age >= 18,
        tos_accepted: tosAccepted,
        popia_accepted: popiaAccepted,
        newsletter_opt_in: newsletterOptIn,
        whatsapp_opt_in: whatsappOptIn,
        sa_challenge_passed: challengePassed,
        verification_status: 'verified',
        role: 'verified',
      })
      .eq('id', session.userId)
    
    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    // Get games and link to user
    const { data: games } = await supabase
      .from('games')
      .select('id, slug')
      .in('slug', selectedGames)
    
    if (games && games.length > 0) {
      // Insert user_games entries
      const userGames = games.map((game, index) => ({
        user_id: session.userId,
        game_id: game.id,
        is_favorite: index === 0, // First game is favorite
      }))
      
      await supabase.from('user_games').insert(userGames)
    }
    
    // Sync Discord roles
    try {
      await syncUserRoles(session.discordId, true, selectedGames)
    } catch (roleError) {
      console.error('Failed to sync Discord roles:', roleError)
      // Don't fail the request if role sync fails
    }
    
    // Log the verification
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: 'user_verified',
      details: {
        games: selectedGames,
        sa_challenge_passed: challengePassed,
      },
    })
    
    // Refresh the session with updated verification status
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single()
    
    if (updatedUser) {
      await createSession(updatedUser)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

