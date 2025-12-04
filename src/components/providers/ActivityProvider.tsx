'use client'

import { createContext, useContext, ReactNode, useCallback, useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { ActivityStatus } from '@/types/database'

interface GameInfo {
  id: string
  slug: string
}

interface ActivityContextType {
  updateStatus: (status: ActivityStatus) => void
  updateGame: (gameId: string | undefined) => void
  currentGameId: string | undefined
}

const ActivityContext = createContext<ActivityContextType | null>(null)

// Map routes to game slugs
const ROUTE_GAME_MAP: Record<string, string> = {
  '/hub/cs2': 'cs2',
  '/hub/valorant': 'valorant',
  '/hub/fifa': 'fifa',
  '/hub/fortnite': 'fortnite',
  '/hub/apex': 'apex',
}

const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export function ActivityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [games, setGames] = useState<GameInfo[]>([])
  const [currentGameId, setCurrentGameId] = useState<string | undefined>()
  const [currentStatus, setCurrentStatus] = useState<ActivityStatus>('online')
  const lastActivityRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Determine current game slug from pathname
  const currentGameSlug = Object.entries(ROUTE_GAME_MAP).find(
    ([route]) => pathname?.startsWith(route)
  )?.[1]

  // Fetch games list on mount to map slugs to IDs
  useEffect(() => {
    fetch('/api/activity/stats')
      .then(res => res.json())
      .then(data => {
        if (data.hubs) {
          setGames(data.hubs.map((h: any) => ({ id: h.id, slug: h.slug })))
        }
      })
      .catch(() => {})
  }, [])

  // Update current game ID when pathname or games change
  useEffect(() => {
    if (currentGameSlug && games.length > 0) {
      const game = games.find(g => g.slug === currentGameSlug)
      setCurrentGameId(game?.id)
    } else {
      setCurrentGameId(undefined)
    }
  }, [currentGameSlug, games])

  // Send heartbeat function
  const sendHeartbeat = useCallback(async (status?: ActivityStatus, gameId?: string | null) => {
    try {
      const body: Record<string, unknown> = {
        status: status || currentStatus,
        currentPage: pathname || window.location.pathname,
      }
      
      // Only include gameId if it's explicitly provided (including null to clear)
      if (gameId !== undefined) {
        body.gameId = gameId
      } else if (currentGameId) {
        body.gameId = currentGameId
      }
      
      await fetch('/api/activity/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (error) {
      console.error('Heartbeat failed:', error)
    }
  }, [currentStatus, currentGameId, pathname])

  // Handle user activity for idle detection
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (currentStatus === 'away') {
      setCurrentStatus('online')
      sendHeartbeat('online')
    }
  }, [currentStatus, sendHeartbeat])

  // Set up heartbeat interval and activity listeners
  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval
    intervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      const IDLE_TIMEOUT = 120000 // 2 minutes
      
      if (timeSinceActivity > IDLE_TIMEOUT && currentStatus !== 'away') {
        setCurrentStatus('away')
        sendHeartbeat('away')
      } else {
        sendHeartbeat()
      }
    }, HEARTBEAT_INTERVAL)

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      // Signal offline
      fetch('/api/activity/heartbeat', { method: 'DELETE' }).catch(() => {})
    }
  }, [sendHeartbeat, handleActivity, currentStatus])

  // Send heartbeat when game changes (entering/leaving hub)
  useEffect(() => {
    sendHeartbeat()
  }, [currentGameId, sendHeartbeat])

  // Track page visits for missions
  useEffect(() => {
    if (pathname?.startsWith('/hub/')) {
      // Track hub visit for mission progress
      fetch('/api/missions/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementType: 'visit_hub', value: 1 }),
      }).catch(() => {})
    }
  }, [pathname])

  const updateStatus = useCallback((status: ActivityStatus) => {
    setCurrentStatus(status)
    sendHeartbeat(status)
  }, [sendHeartbeat])

  const updateGame = useCallback((gameId: string | undefined) => {
    setCurrentGameId(gameId)
  }, [])

  return (
    <ActivityContext.Provider value={{ updateStatus, updateGame, currentGameId }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const context = useContext(ActivityContext)
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider')
  }
  return context
}

