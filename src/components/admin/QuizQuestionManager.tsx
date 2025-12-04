'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shuffle, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  GripVertical
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

interface QuizQuestionManagerProps {
  quizId: string
  gameId: string
  questionCount: number
  currentQuestions: any[]
  availableQuestions: any[]
}

export function QuizQuestionManager({ 
  quizId, 
  gameId,
  questionCount,
  currentQuestions, 
  availableQuestions 
}: QuizQuestionManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('any')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const questionsNeeded = questionCount - currentQuestions.length

  const filteredAvailable = availableQuestions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = difficultyFilter === 'any' || q.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  const handleAutoSelect = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'auto-select',
          count: questionCount,
          difficulty: difficultyFilter,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-select')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add',
          questionIds: Array.from(selectedIds),
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'remove',
          questionIds: [questionId],
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Remove all questions from this quiz?')) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear questions')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="success" size="sm">Easy</Badge>
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>
      case 'hard':
        return <Badge variant="danger" size="sm">Hard</Badge>
      default:
        return <Badge size="sm">{difficulty}</Badge>
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Current Questions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Quiz Questions ({currentQuestions.length}/{questionCount})
          </h2>
          {currentQuestions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={loading}>
              <Trash2 className="w-4 h-4 text-red-400" />
              Clear All
            </Button>
          )}
        </div>
        
        {currentQuestions.length > 0 ? (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {currentQuestions.map((qq, index) => (
              <div 
                key={qq.id}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{qq.question.question_text}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getDifficultyBadge(qq.question.difficulty)}
                      {qq.question.category && (
                        <span className="text-xs text-gray-500">{qq.question.category}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveQuestion(qq.question_id)}
                    disabled={loading}
                    className="p-1 hover:bg-red-500/10 rounded text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No questions added yet</p>
            <p className="text-sm mt-1">Use auto-select or add from the question bank</p>
          </div>
        )}
      </Card>
      
      {/* Question Bank */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Question Bank</h2>
          <Button onClick={handleAutoSelect} disabled={loading || questionsNeeded <= 0}>
            <Shuffle className="w-4 h-4" />
            Auto-Select {questionsNeeded > 0 ? questionsNeeded : 'All'}
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="pl-10"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
          >
            <option value="any">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        {/* Selection Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-ggza-gold/10 mb-4">
            <span className="text-ggza-gold">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button size="sm" onClick={handleAddSelected} disabled={loading}>
                <Plus className="w-4 h-4" />
                Add Selected
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}
        
        {/* Questions List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredAvailable.map((q) => (
            <div 
              key={q.id}
              className={cn(
                'p-3 rounded-xl border-2 cursor-pointer transition-all',
                selectedIds.has(q.id) 
                  ? 'border-ggza-gold bg-ggza-gold/10' 
                  : 'border-transparent bg-white/5 hover:bg-white/10'
              )}
              onClick={() => toggleSelect(q.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  selectedIds.has(q.id) ? 'border-ggza-gold bg-ggza-gold' : 'border-white/20'
                )}>
                  {selectedIds.has(q.id) && <Check className="w-3 h-3 text-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-sm text-white cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedQuestion(expandedQuestion === q.id ? null : q.id)
                    }}
                  >
                    {q.question_text}
                    <button className="ml-2 text-gray-500 hover:text-white">
                      {expandedQuestion === q.id ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                    </button>
                  </div>
                  
                  {/* Expanded view with options */}
                  {expandedQuestion === q.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {q.options.map((opt: string, idx: number) => (
                        <div 
                          key={idx}
                          className={cn(
                            'text-xs px-2 py-1.5 rounded',
                            idx === q.correct_index 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-white/5 text-gray-400'
                          )}
                        >
                          {opt} {idx === q.correct_index && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    {getDifficultyBadge(q.difficulty)}
                    {q.category && (
                      <span className="text-xs text-gray-500">{q.category}</span>
                    )}
                    <span className="text-xs text-gray-600">
                      Used {q.times_used}x | {q.times_used > 0 ? Math.round((q.times_correct / q.times_used) * 100) : 0}% correct
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredAvailable.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {availableQuestions.length === 0 
                ? 'All questions already added to quiz'
                : 'No questions match your filters'}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

