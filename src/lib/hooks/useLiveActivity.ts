'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HubActivity {
  id: string
  slug: string
  name: string
  color: string
  count: number
}

interface LiveActivityData {
  totalOnline: number
  inVoice: number
  inQuiz: number
  hubs: HubActivity[]
}

const POLL_INTERVAL = 15000 // 15 seconds
const REALTIME_DEBOUNCE = 1000 // 1 second

export function useLiveActivity() {
  const [data, setData] = useState<LiveActivityData>({
    totalOnline: 0,
    inVoice: 0,
    inQuiz: 0,
    hubs: [],
  })
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const supabaseRef = useRef(createClient())

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const stats = await res.json()
      setData(stats)
      setIsConnected(true)
    } catch (err) {
      console.error('Activity stats error:', err)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced refresh for realtime updates
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      fetchStats()
    }, REALTIME_DEBOUNCE)
  }, [fetchStats])

  useEffect(() => {
    // Initial fetch
    fetchStats()

    // Set up polling as fallback
    const pollInterval = setInterval(fetchStats, POLL_INTERVAL)

    // Set up Supabase realtime subscription
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('user_activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity',
        },
        () => {
          // Debounced refresh on any activity change
          debouncedRefresh()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      clearInterval(pollInterval)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      channel.unsubscribe()
    }
  }, [fetchStats, debouncedRefresh])

  return { data, loading, isConnected, refresh: fetchStats }
}

