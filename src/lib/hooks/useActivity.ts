'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ActivityStatus } from '@/types/database'

const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const IDLE_TIMEOUT = 120000 // 2 minutes

interface ActivityOptions {
  gameId?: string
  status?: ActivityStatus
  currentPage?: string
}

export function useActivityHeartbeat(options: ActivityOptions = {}) {
  const { gameId, status = 'online', currentPage } = options
  const lastActivityRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  const sendHeartbeat = useCallback(async (currentStatus?: ActivityStatus) => {
    try {
      await fetch('/api/activity/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          status: currentStatus || status,
          currentPage: currentPage || window.location.pathname,
        }),
      })
    } catch (error) {
      console.error('Heartbeat failed:', error)
    }
  }, [gameId, status, currentPage])

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (!isActiveRef.current) {
      isActiveRef.current = true
      sendHeartbeat('online')
    }
  }, [sendHeartbeat])

  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval
    intervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      
      if (timeSinceActivity > IDLE_TIMEOUT && isActiveRef.current) {
        isActiveRef.current = false
        sendHeartbeat('away')
      } else if (isActiveRef.current) {
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
  }, [sendHeartbeat, handleActivity])

  // Update heartbeat when options change
  useEffect(() => {
    sendHeartbeat()
  }, [gameId, status, currentPage, sendHeartbeat])

  return { sendHeartbeat }
}

