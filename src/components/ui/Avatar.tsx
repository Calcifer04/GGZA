'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getDiscordAvatarUrl } from '@/lib/discord'

export interface AvatarProps {
  discordId: string
  avatarHash: string | null
  username: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showRing?: boolean
  ringColor?: 'gold' | 'green' | 'red'
}

const sizeMap = {
  sm: { dimension: 32, text: 'text-xs' },
  md: { dimension: 40, text: 'text-sm' },
  lg: { dimension: 56, text: 'text-base' },
  xl: { dimension: 80, text: 'text-xl' },
}

export function Avatar({ 
  discordId, 
  avatarHash, 
  username, 
  size = 'md',
  className,
  showRing = false,
  ringColor = 'gold',
}: AvatarProps) {
  const { dimension, text } = sizeMap[size]
  const avatarUrl = getDiscordAvatarUrl(discordId, avatarHash, dimension * 2)

  const ringColors = {
    gold: 'ring-ggza-gold',
    green: 'ring-ggza-green',
    red: 'ring-ggza-red',
  }

  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden bg-ggza-black-lighter flex items-center justify-center',
        showRing && `ring-2 ${ringColors[ringColor]} ring-offset-2 ring-offset-ggza-black`,
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {avatarHash ? (
        <Image
          src={avatarUrl}
          alt={username}
          width={dimension}
          height={dimension}
          className="object-cover"
        />
      ) : (
        <span className={cn('font-semibold text-ggza-gold', text)}>
          {username.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

