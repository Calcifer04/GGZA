import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { QuestionBankManager } from '@/components/admin/QuestionBankManager'

async function getQuestionsData() {
  const supabase = createAdminSupabaseClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('quiz_day', { ascending: true })
  
  const { data: questions } = await supabase
    .from('questions')
    .select('*, game:games(*)')
    .order('created_at', { ascending: false })
    .limit(200)
  
  // Get counts per game
  const { data: counts } = await supabase
    .from('questions')
    .select('game_id')
    .eq('is_active', true)
  
  const countsByGame: Record<string, number> = {}
  counts?.forEach(q => {
    countsByGame[q.game_id] = (countsByGame[q.game_id] || 0) + 1
  })
  
  return { 
    games: games || [], 
    questions: questions || [],
    countsByGame,
  }
}

export default async function QuestionsPage() {
  await requireAdmin()
  const { games, questions, countsByGame } = await getQuestionsData()

  return (
    <QuestionBankManager 
      games={games} 
      questions={questions} 
      countsByGame={countsByGame}
    />
  )
}
