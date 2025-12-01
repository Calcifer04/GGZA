// ===========================================
// Discord OAuth & API Utilities
// ===========================================

const DISCORD_API_BASE = 'https://discord.com/api/v10'
const DISCORD_CDN = 'https://cdn.discordapp.com'

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string
  verified: boolean
  global_name: string | null
}

export interface DiscordTokens {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

export function getDiscordOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`,
    response_type: 'code',
    scope: 'identify email guilds.join',
    state,
  })
  
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<DiscordTokens> {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`,
  })

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Discord token exchange failed: ${error}`)
  }

  return response.json()
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Discord user')
  }

  return response.json()
}

export async function isUserInGuild(userId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID
  
  if (!guildId) {
    console.warn('DISCORD_GUILD_ID not configured')
    return false
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  )

  return response.status === 200
}

export async function addUserToGuild(
  accessToken: string,
  userId: string,
  roles?: string[]
): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID
  
  if (!guildId) {
    console.warn('DISCORD_GUILD_ID not configured')
    return false
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        roles: roles || [],
      }),
    }
  )

  return response.status === 201 || response.status === 204
}

export async function addRoleToUser(userId: string, roleId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID
  
  if (!guildId) return false

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  )

  return response.status === 204
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID
  
  if (!guildId) return false

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  )

  return response.status === 204
}

export async function sendDiscordDM(userId: string, content: string): Promise<boolean> {
  const channelResponse = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: userId }),
  })

  if (!channelResponse.ok) return false

  const channel = await channelResponse.json()

  const messageResponse = await fetch(
    `${DISCORD_API_BASE}/channels/${channel.id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    }
  )

  return messageResponse.ok
}

export function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  size: number = 128
): string {
  if (avatarHash) {
    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png'
    return `${DISCORD_CDN}/avatars/${userId}/${avatarHash}.${extension}?size=${size}`
  }
  
  const defaultIndex = Number(BigInt(userId) >> BigInt(22)) % 6
  return `${DISCORD_CDN}/embed/avatars/${defaultIndex}.png`
}

export function getGameRoleId(gameSlug: string): string | undefined {
  const roleMap: Record<string, string | undefined> = {
    cs2: process.env.DISCORD_ROLE_CS2,
    valorant: process.env.DISCORD_ROLE_VALORANT,
    fifa: process.env.DISCORD_ROLE_FIFA,
    fortnite: process.env.DISCORD_ROLE_FORTNITE,
    apex: process.env.DISCORD_ROLE_APEX,
  }
  
  return roleMap[gameSlug]
}

export async function syncUserRoles(
  discordId: string,
  isVerified: boolean,
  selectedGames: string[]
): Promise<void> {
  if (isVerified) {
    const unverifiedRole = process.env.DISCORD_ROLE_UNVERIFIED
    const verifiedRole = process.env.DISCORD_ROLE_VERIFIED
    
    if (unverifiedRole) await removeRoleFromUser(discordId, unverifiedRole)
    if (verifiedRole) await addRoleToUser(discordId, verifiedRole)
  }

  for (const gameSlug of selectedGames) {
    const roleId = getGameRoleId(gameSlug)
    if (roleId) {
      await addRoleToUser(discordId, roleId)
    }
  }
}

