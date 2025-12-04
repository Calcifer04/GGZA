'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Check, AlertTriangle, Copy, FileJson } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface BulkQuestionImportProps {
  games: { id: string; slug: string; display_name: string }[]
}

const EXAMPLE_FORMAT = `[
  {
    "question": "What is the most expensive rifle in CS2?",
    "answers": ["AWP", "AK-47", "M4A1-S", "SG 553"],
    "correct": 0,
    "difficulty": "easy",
    "category": "Weapons"
  },
  {
    "question": "Which agent has the ability 'Tailwind'?",
    "answers": ["Jett", "Raze", "Phoenix", "Reyna"],
    "correct": 0,
    "difficulty": "medium"
  }
]`

export function BulkQuestionImport({ games }: BulkQuestionImportProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gameId, setGameId] = useState(games[0]?.id || '')
  const [jsonInput, setJsonInput] = useState('')
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const handleImport = async () => {
    setLoading(true)
    setResults(null)
    
    let questions: any[]
    try {
      questions = JSON.parse(jsonInput)
      if (!Array.isArray(questions)) {
        throw new Error('Input must be a JSON array')
      }
    } catch (err) {
      setResults({ success: 0, failed: 0, errors: ['Invalid JSON format. Please check your input.'] })
      setLoading(false)
      return
    }
    
    let success = 0
    let failed = 0
    const errors: string[] = []
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      // Validate structure
      if (!q.question || !q.answers || q.answers.length !== 4 || q.correct === undefined) {
        errors.push(`Question ${i + 1}: Missing required fields (question, answers[4], correct)`)
        failed++
        continue
      }
      
      if (q.correct < 0 || q.correct > 3) {
        errors.push(`Question ${i + 1}: correct must be 0-3`)
        failed++
        continue
      }
      
      try {
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            questionText: q.question,
            options: q.answers,
            correctIndex: q.correct,
            difficulty: q.difficulty || 'medium',
            category: q.category || null,
          }),
        })
        
        if (res.ok) {
          success++
        } else {
          const data = await res.json()
          errors.push(`Question ${i + 1}: ${data.error || 'Failed to create'}`)
          failed++
        }
      } catch (err) {
        errors.push(`Question ${i + 1}: Network error`)
        failed++
      }
    }
    
    setResults({ success, failed, errors })
    setLoading(false)
    
    if (success > 0) {
      router.refresh()
    }
  }

  const copyExample = () => {
    navigator.clipboard.writeText(EXAMPLE_FORMAT)
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload className="w-4 h-4" />
        Bulk Import
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={() => setIsOpen(false)} />
      
      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileJson className="w-5 h-5 text-ggza-gold" />
            Bulk Import Questions
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Game Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Import to Game</label>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>{game.display_name}</option>
            ))}
          </select>
        </div>
        
        {/* Format Example */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">JSON Format</label>
            <Button variant="ghost" size="sm" onClick={copyExample}>
              <Copy className="w-3 h-3" />
              Copy Example
            </Button>
          </div>
          <pre className="p-4 rounded-xl bg-ggza-black-lighter border border-white/10 text-xs text-gray-400 overflow-x-auto">
{`[
  {
    "question": "Your question text here",
    "answers": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,           // 0-3 (index of correct answer)
    "difficulty": "medium", // easy, medium, hard (optional)
    "category": "Weapons"   // optional
  },
  ...more questions
]`}
          </pre>
        </div>
        
        {/* JSON Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Paste JSON (one array of questions)
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white font-mono text-sm min-h-[200px]"
            placeholder={EXAMPLE_FORMAT}
          />
        </div>
        
        {/* Results */}
        {results && (
          <div className={`p-4 rounded-xl mb-4 ${results.failed > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
            <div className="flex items-center gap-4 mb-2">
              {results.success > 0 && (
                <span className="flex items-center gap-1 text-green-400">
                  <Check className="w-4 h-4" />
                  {results.success} imported
                </span>
              )}
              {results.failed > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  {results.failed} failed
                </span>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="text-sm text-red-400 space-y-1 max-h-32 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            loading={loading}
            disabled={!jsonInput.trim()}
          >
            <Upload className="w-4 h-4" />
            Import Questions
          </Button>
        </div>
      </Card>
    </div>
  )
}

