'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RequirementType } from '@/types/database'

interface Mission {
  id: string
  slug: string
  title: string
  description: string
  xpReward: number
  icon: string
  requirementType: RequirementType
  requirementValue: number
  progress: number
  completed: boolean
  claimed: boolean
  completedAt: string | null
}

interface MissionsData {
  daily: Mission[]
  weekly: Mission[]
  achievements: Mission[]
  periodKeys: {
    daily: string
    weekly: string
  }
}

export function useMissions() {
  const [data, setData] = useState<MissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch('/api/missions')
      if (!res.ok) throw new Error('Failed to fetch missions')
      const missionsData = await res.json()
      setData(missionsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  const claim = useCallback(async (missionId: string, periodKey: string) => {
    try {
      const res = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, periodKey }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to claim')
      }
      const result = await res.json()
      
      // Refresh missions
      await fetchMissions()
      
      return result
    } catch (err) {
      console.error('Claim mission error:', err)
      return null
    }
  }, [fetchMissions])

  const trackProgress = useCallback(async (
    requirementType: RequirementType,
    value = 1,
    gameId?: string
  ) => {
    try {
      const res = await fetch('/api/missions/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementType, value, gameId }),
      })
      if (!res.ok) return null
      const result = await res.json()
      
      // Refresh if any missions were completed
      if (result.completedCount > 0) {
        await fetchMissions()
      }
      
      return result
    } catch (err) {
      console.error('Track progress error:', err)
      return null
    }
  }, [fetchMissions])

  return { data, loading, error, claim, trackProgress, refresh: fetchMissions }
}

