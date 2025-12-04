'use client'

import { useEffect } from 'react'
import { HubActivityCard } from '@/components/dashboard'
import { useMissions } from '@/lib/hooks'

interface HubActivitySectionProps {
  gameId: string
  gameSlug: string
  gameName: string
  gameColor: string
}

export function HubActivitySection({ 
  gameId, 
  gameSlug, 
  gameName, 
  gameColor 
}: HubActivitySectionProps) {
  const { trackProgress } = useMissions()

  // Track hub visit on mount for missions
  // ActivityProvider now handles all heartbeat tracking including game context
  useEffect(() => {
    trackProgress('visit_hub', 1, gameId)
  }, [gameId, trackProgress])

  return (
    <HubActivityCard 
      gameSlug={gameSlug} 
      gameName={gameName} 
      gameColor={gameColor} 
    />
  )
}

export default HubActivitySection

