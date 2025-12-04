import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { QuizManagement } from '@/components/admin/QuizManagement'

async function getQuizzesData() {
  const supabase = createAdminSupabaseClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('quiz_day', { ascending: true })
  
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      *,
      game:games(*),
      quiz_questions(count),
      quiz_scores(count)
    `)
    .order('scheduled_at', { ascending: false })
    .limit(100)
  
  return { 
    games: games || [], 
    quizzes: quizzes || [],
  }
}

export default async function QuizzesPage() {
  await requireAdmin()
  const { games, quizzes } = await getQuizzesData()

  return <QuizManagement games={games} quizzes={quizzes} />
}
