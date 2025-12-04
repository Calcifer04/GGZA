'use client'

import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'game'
  gameSlug?: 'cs2' | 'valorant' | 'fifa' | 'fortnite' | 'apex'
  size?: 'sm' | 'md' | 'lg'
}

const gameColors: Record<string, string> = {
  cs2: 'bg-game-cs2/20 text-game-cs2 border-game-cs2/30',
  valorant: 'bg-game-valorant/20 text-game-valorant border-game-valorant/30',
  fifa: 'bg-game-fifa/20 text-game-fifa border-game-fifa/30',
  fortnite: 'bg-game-fortnite/20 text-game-fortnite border-game-fortnite/30',
  apex: 'bg-game-apex/20 text-game-apex border-game-apex/30',
}

export function Badge({ 
  className, 
  variant = 'default', 
  gameSlug,
  size = 'md',
  children, 
  ...props 
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-gray-300 border-white/10',
    gold: 'bg-ggza-gold/20 text-ggza-gold border-ggza-gold/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    game: gameSlug ? gameColors[gameSlug] : '',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

