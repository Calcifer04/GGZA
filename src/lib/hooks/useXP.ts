'use client'

import { useState, useEffect, useCallback } from 'react'

interface XPData {
  xp: number
  level: number
  streakDays: number
  lastDailyClaim: string | null
  currentLevelXP: number
  nextLevelXP: number | null
  levelTitle: string
  levelColor: string
}

interface DailyStatus {
  canClaim: boolean
  currentStreak: number
  potentialStreak: number
  potentialXP: number
  lastClaim: string | null
}

export function useXP() {
  const [data, setData] = useState<XPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchXP = useCallback(async () => {
    try {
      const res = await fetch('/api/xp')
      if (!res.ok) throw new Error('Failed to fetch XP')
      const xpData = await res.json()
      setData(xpData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchXP()
  }, [fetchXP])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchXP()
  }, [fetchXP])

  return { data, loading, error, refresh }
}

export function useDailyReward() {
  const [status, setStatus] = useState<DailyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/xp/daily')
      if (!res.ok) throw new Error('Failed to fetch daily status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Daily status error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const claim = useCallback(async () => {
    if (claiming || !status?.canClaim) return null
    
    setClaiming(true)
    try {
      const res = await fetch('/api/xp/daily', { method: 'POST' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to claim')
      }
      const result = await res.json()
      
      // Refresh status
      await fetchStatus()
      
      return result
    } catch (err) {
      console.error('Claim error:', err)
      return null
    } finally {
      setClaiming(false)
    }
  }, [claiming, status, fetchStatus])

  return { status, loading, claiming, claim, refresh: fetchStatus }
}

