import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { syncUserRoles } from '@/lib/discord'

export async function PUT(request: Request) {
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
      newsletterOptIn,
      whatsappOptIn,
      selectedGames,
    } = body
    
    const supabase = createAdminSupabaseClient()
    
    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        mobile,
        newsletter_opt_in: newsletterOptIn,
        whatsapp_opt_in: whatsappOptIn,
      })
      .eq('id', session.userId)
    
    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    // Update user games
    if (selectedGames && Array.isArray(selectedGames)) {
      // Delete existing user_games
      await supabase
        .from('user_games')
        .delete()
        .eq('user_id', session.userId)
      
      // Insert new user_games
      if (selectedGames.length > 0) {
        const userGames = selectedGames.map((gameId: string, index: number) => ({
          user_id: session.userId,
          game_id: gameId,
          is_favorite: index === 0,
        }))
        
        await supabase.from('user_games').insert(userGames)
        
        // Get game slugs for Discord role sync
        const { data: games } = await supabase
          .from('games')
          .select('slug')
          .in('id', selectedGames)
        
        const gameSlugs = games?.map(g => g.slug) || []
        
        // Sync Discord roles
        try {
          await syncUserRoles(session.discordId, session.isVerified, gameSlugs)
        } catch (roleError) {
          console.error('Failed to sync Discord roles:', roleError)
        }
      }
    }
    
    // Log the update
    await supabase.from('audit_logs').insert({
      actor_id: session.userId,
      actor_type: 'user',
      action: 'profile_updated',
      details: { fields: Object.keys(body) },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

