import { createAdminSupabaseClient } from './supabase/server'
import type { XPSourceType } from '@/types/database'

// XP reward amounts
export const XP_REWARDS = {
  quiz_completion: 25,
  quiz_correct_answer: 5,
  quiz_win_first: 100,
  quiz_win_second: 75,
  quiz_win_third: 50,
  quiz_top_10: 25,
  daily_claim: 15,
  streak_bonus_per_day: 5,
  max_streak_bonus: 50,
} as const

interface AwardXPParams {
  userId: string
  amount: number
  reason: string
  sourceType: XPSourceType
  sourceId?: string
}

/**
 * Award XP to a user and record the transaction
 */
export async function awardXP({ userId, amount, reason, sourceType, sourceId }: AwardXPParams) {
  const supabase = createAdminSupabaseClient()

  // Get current XP
  const { data: user } = await supabase
    .from('users')
    .select('xp')
    .eq('id', userId)
    .single()

  if (!user) {
    throw new Error('User not found')
  }

  // Update XP
  const newXP = user.xp + amount
  await supabase
    .from('users')
    .update({ xp: newXP })
    .eq('id', userId)

  // Record transaction
  await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    reason,
    source_type: sourceType,
    source_id: sourceId,
  })

  return { newXP, gained: amount }
}

interface QuizXPResult {
  totalXP: number
  breakdown: {
    completion: number
    correctAnswers: number
    placement: number
  }
}

/**
 * Calculate and award XP for a completed quiz
 */
export async function awardQuizXP(
  userId: string,
  quizId: string,
  correctAnswers: number,
  rank: number | null
): Promise<QuizXPResult> {
  // Calculate XP breakdown
  let completionXP = XP_REWARDS.quiz_completion
  let correctXP = correctAnswers * XP_REWARDS.quiz_correct_answer
  let placementXP = 0

  if (rank === 1) {
    placementXP = XP_REWARDS.quiz_win_first
  } else if (rank === 2) {
    placementXP = XP_REWARDS.quiz_win_second
  } else if (rank === 3) {
    placementXP = XP_REWARDS.quiz_win_third
  } else if (rank && rank <= 10) {
    placementXP = XP_REWARDS.quiz_top_10
  }

  const totalXP = completionXP + correctXP + placementXP

  // Award the XP
  await awardXP({
    userId,
    amount: totalXP,
    reason: `Quiz completed (${correctAnswers} correct, rank #${rank || 'N/A'})`,
    sourceType: 'quiz',
    sourceId: quizId,
  })

  return {
    totalXP,
    breakdown: {
      completion: completionXP,
      correctAnswers: correctXP,
      placement: placementXP,
    },
  }
}

/**
 * Update mission progress for a quiz completion
 */
export async function updateQuizMissions(
  userId: string,
  totalPoints: number,
  rank: number | null,
  gameId?: string
) {
  const supabase = createAdminSupabaseClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Get week number
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  const weekKey = `week_${now.getFullYear()}_${weekNumber}`

  // Get all relevant missions
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('is_active', true)
    .in('requirement_type', ['play_quiz', 'score_points', 'win_quiz'])

  if (!missions) return

  for (const mission of missions) {
    let periodKey: string
    if (mission.mission_type === 'daily') {
      periodKey = `daily_${today}`
    } else if (mission.mission_type === 'weekly') {
      periodKey = weekKey
    } else {
      periodKey = 'achievement'
    }

    // Skip game-specific missions that don't match
    if (mission.game_id && gameId && mission.game_id !== gameId) {
      continue
    }

    // Get existing progress
    const { data: existing } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .eq('period_key', periodKey)
      .single()

    if (existing?.completed) continue

    let newProgress = existing?.progress || 0
    let shouldUpdate = false

    switch (mission.requirement_type) {
      case 'play_quiz':
        newProgress += 1
        shouldUpdate = true
        break
      case 'score_points':
        newProgress += totalPoints
        shouldUpdate = true
        break
      case 'win_quiz':
        if (rank === 1) {
          newProgress += 1
          shouldUpdate = true
        }
        break
    }

    if (shouldUpdate) {
      const isCompleted = newProgress >= mission.requirement_value

      await supabase.from('user_missions').upsert({
        user_id: userId,
        mission_id: mission.id,
        period_key: periodKey,
        progress: newProgress,
        completed: isCompleted,
        completed_at: isCompleted ? now.toISOString() : null,
      }, {
        onConflict: 'user_id,mission_id,period_key',
      })
    }
  }
}

// Level thresholds (matches database)
const LEVEL_THRESHOLDS = [
  { level: 1, xp_required: 0, title: 'Rookie', badge_color: '#9CA3AF' },
  { level: 2, xp_required: 100, title: 'Rookie', badge_color: '#9CA3AF' },
  { level: 3, xp_required: 250, title: 'Rookie', badge_color: '#9CA3AF' },
  { level: 4, xp_required: 500, title: 'Apprentice', badge_color: '#60A5FA' },
  { level: 5, xp_required: 850, title: 'Apprentice', badge_color: '#60A5FA' },
  { level: 6, xp_required: 1300, title: 'Apprentice', badge_color: '#60A5FA' },
  { level: 7, xp_required: 1900, title: 'Competitor', badge_color: '#34D399' },
  { level: 8, xp_required: 2700, title: 'Competitor', badge_color: '#34D399' },
  { level: 9, xp_required: 3700, title: 'Competitor', badge_color: '#34D399' },
  { level: 10, xp_required: 5000, title: 'Expert', badge_color: '#A78BFA' },
  { level: 11, xp_required: 6500, title: 'Expert', badge_color: '#A78BFA' },
  { level: 12, xp_required: 8500, title: 'Expert', badge_color: '#A78BFA' },
  { level: 13, xp_required: 11000, title: 'Master', badge_color: '#F59E0B' },
  { level: 14, xp_required: 14000, title: 'Master', badge_color: '#F59E0B' },
  { level: 15, xp_required: 18000, title: 'Master', badge_color: '#F59E0B' },
  { level: 16, xp_required: 23000, title: 'Grandmaster', badge_color: '#EF4444' },
  { level: 17, xp_required: 29000, title: 'Grandmaster', badge_color: '#EF4444' },
  { level: 18, xp_required: 36000, title: 'Grandmaster', badge_color: '#EF4444' },
  { level: 19, xp_required: 45000, title: 'Legend', badge_color: '#FFD700' },
  { level: 20, xp_required: 55000, title: 'Legend', badge_color: '#FFD700' },
  { level: 21, xp_required: 70000, title: 'Champion', badge_color: '#FF6B6B' },
  { level: 22, xp_required: 90000, title: 'Champion', badge_color: '#FF6B6B' },
  { level: 23, xp_required: 115000, title: 'Champion', badge_color: '#FF6B6B' },
  { level: 24, xp_required: 145000, title: 'Immortal', badge_color: '#00D9FF' },
  { level: 25, xp_required: 200000, title: 'Immortal', badge_color: '#00D9FF' },
]

/**
 * Calculate level from XP (synchronous, no DB query)
 */
export function calculateLevel(xp: number) {
  let current = LEVEL_THRESHOLDS[0]
  let next = LEVEL_THRESHOLDS[1]
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp_required) {
      current = LEVEL_THRESHOLDS[i]
      next = LEVEL_THRESHOLDS[i + 1] || null
      break
    }
  }
  
  return {
    level: current.level,
    title: current.title,
    color: current.badge_color,
    currentXP: xp,
    currentLevelXP: current.xp_required,
    nextLevelXP: next?.xp_required || null,
    progress: next 
      ? ((xp - current.xp_required) / (next.xp_required - current.xp_required)) * 100
      : 100,
  }
}

/**
 * Get level info from XP (async version with DB)
 */
export async function getLevelInfo(xp: number) {
  const supabase = createAdminSupabaseClient()
  
  const { data: thresholds } = await supabase
    .from('level_thresholds')
    .select('*')
    .lte('xp_required', xp)
    .order('level', { ascending: false })
    .limit(1)

  const { data: nextLevel } = await supabase
    .from('level_thresholds')
    .select('*')
    .gt('xp_required', xp)
    .order('level', { ascending: true })
    .limit(1)

  const current = thresholds?.[0] || { level: 1, xp_required: 0, title: 'Rookie', badge_color: '#9CA3AF' }
  const next = nextLevel?.[0]

  return {
    level: current.level,
    title: current.title,
    color: current.badge_color,
    currentXP: xp,
    currentLevelXP: current.xp_required,
    nextLevelXP: next?.xp_required || null,
    progress: next 
      ? ((xp - current.xp_required) / (next.xp_required - current.xp_required)) * 100
      : 100,
  }
}

