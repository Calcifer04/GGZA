import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge, Button } from '@/components/ui'
import { Plus, Search, Filter, Gamepad2 } from 'lucide-react'
import { GAME_COLORS } from '@/lib/utils'
import { QuestionForm } from '@/components/admin/QuestionForm'

async function getQuestionsData() {
  const supabase = createAdminSupabaseClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
  
  const { data: questions } = await supabase
    .from('questions')
    .select('*, game:games(*)')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return { games: games || [], questions: questions || [] }
}

export default async function QuestionsPage() {
  await requireAdmin()
  const { games, questions } = await getQuestionsData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-white mb-2">Question Bank</h1>
          <p className="text-gray-400">{questions.length} questions in database</p>
        </div>
        
        <QuestionForm games={games} />
      </div>
      
      {/* Questions List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Question</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Game</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Difficulty</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Used</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Success Rate</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question: any) => {
                const successRate = question.times_used > 0 
                  ? Math.round((question.times_correct / question.times_used) * 100)
                  : 0
                  
                return (
                  <tr key={question.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="max-w-md truncate text-white">{question.question_text}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="game" gameSlug={question.game?.slug}>
                        {question.game?.display_name}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          question.difficulty === 'easy' ? 'success' :
                          question.difficulty === 'medium' ? 'warning' : 'danger'
                        }
                        size="sm"
                      >
                        {question.difficulty}
                      </Badge>
                    </td>
                    <td className="p-4 text-right text-gray-400">{question.times_used}</td>
                    <td className="p-4 text-right">
                      <span className={successRate > 50 ? 'text-green-400' : 'text-red-400'}>
                        {successRate}%
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={question.is_active ? 'success' : 'default'} size="sm">
                        {question.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {questions.length === 0 && (
          <div className="p-12 text-center">
            <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No questions in the database yet</p>
          </div>
        )}
      </Card>
    </div>
  )
}

