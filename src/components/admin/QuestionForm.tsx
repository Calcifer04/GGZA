'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import type { Game } from '@/types/database'

interface QuestionFormProps {
  games: Game[]
}

export function QuestionForm({ games }: QuestionFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    gameId: games[0]?.id || '',
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    difficulty: 'medium',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create question')
      }
      
      setIsOpen(false)
      setFormData({
        gameId: games[0]?.id || '',
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        difficulty: 'medium',
        category: '',
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt),
    }))
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Question
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={() => setIsOpen(false)} />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Question</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
            <select
              value={formData.gameId}
              onChange={(e) => setFormData(prev => ({ ...prev, gameId: e.target.value }))}
              className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>{game.display_name}</option>
              ))}
            </select>
          </div>
          
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white min-h-[100px]"
              placeholder="Enter the question..."
              required
            />
          </div>
          
          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Answer Options</label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, correctIndex: index }))}
                    className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
                      ${formData.correctIndex === index 
                        ? 'border-green-500 bg-green-500 text-white' 
                        : 'border-white/20'}
                    `}
                  >
                    {formData.correctIndex === index && '✓'}
                  </button>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Click the circle to mark the correct answer</p>
          </div>
          
          {/* Difficulty & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category (optional)</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Weapons, Maps, Pro Scene"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Question
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

