'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'game'
  gameSlug?: 'cs2' | 'valorant' | 'fifa' | 'fortnite' | 'apex'
  interactive?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', gameSlug, interactive = false, children, ...props }, ref) => {
    const gameClasses = gameSlug ? `game-${gameSlug}` : ''
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-white/5 bg-gradient-to-b from-ggza-black-lighter/80 to-ggza-black/95 p-6',
          interactive && 'cursor-pointer hover:border-ggza-gold/20 hover:shadow-card-hover transition-all duration-300',
          variant === 'glow' && 'card-glow',
          variant === 'game' && gameSlug && `border-l-4 ${gameClasses} game-accent`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }

