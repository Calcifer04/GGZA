'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Calendar, Clock, Trophy } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import type { Game } from '@/types/database'

interface CreateQuizFormProps {
  games: Game[]
}

export function CreateQuizForm({ games }: CreateQuizFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Get current week number
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
  
  const [formData, setFormData] = useState({
    gameId: games[0]?.id || '',
    title: '',
    description: '',
    scheduledAt: '',
    questionCount: 30,
    timePerQuestion: 5,
    prizePool: 1000,
    weekNumber: weekNumber,
    year: now.getFullYear(),
    isMonthlyFinal: false,
  })

  // Auto-generate title when game changes
  const handleGameChange = (gameId: string) => {
    const game = games.find(g => g.id === gameId)
    setFormData(prev => ({
      ...prev,
      gameId,
      title: game ? `${game.display_name} Weekly Quiz - Week ${prev.weekNumber}` : prev.title,
    }))
  }

  // Suggest next scheduled time based on game's quiz day
  const suggestScheduledTime = () => {
    const game = games.find(g => g.id === formData.gameId)
    if (!game) return
    
    const today = new Date()
    const targetDay = game.quiz_day // 0 = Sunday, 1 = Monday, etc.
    let daysUntilTarget = targetDay - today.getDay()
    
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7 // Move to next week
    }
    
    const nextQuizDate = new Date(today)
    nextQuizDate.setDate(today.getDate() + daysUntilTarget)
    nextQuizDate.setHours(19, 0, 0, 0) // 7 PM SAST
    
    // Format for datetime-local input
    const formatted = nextQuizDate.toISOString().slice(0, 16)
    setFormData(prev => ({ ...prev, scheduledAt: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create quiz')
      }
      
      setIsOpen(false)
      router.push(`/admin/quizzes/${data.quiz.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" />
        Create Quiz
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={() => setIsOpen(false)} />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Quiz</h2>
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
              onChange={(e) => handleGameChange(e.target.value)}
              className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>{game.display_name}</option>
              ))}
            </select>
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., CS2 Weekly Quiz - Week 49"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white min-h-[80px]"
              placeholder="Special notes about this quiz..."
            />
          </div>
          
          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Scheduled Date & Time</label>
            <div className="flex gap-3">
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="flex-1 px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
                required
              />
              <Button type="button" variant="outline" onClick={suggestScheduledTime}>
                <Calendar className="w-4 h-4" />
                Suggest
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Quiz will automatically go live at this time</p>
          </div>
          
          {/* Week & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Week Number</label>
              <Input
                type="number"
                value={formData.weekNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, weekNumber: parseInt(e.target.value) }))}
                min={1}
                max={53}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min={2024}
                required
              />
            </div>
          </div>
          
          {/* Quiz Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Questions</label>
              <select
                value={formData.questionCount}
                onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={30}>30</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time/Question</label>
              <select
                value={formData.timePerQuestion}
                onChange={(e) => setFormData(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-ggza-black-lighter border border-white/10 rounded-xl text-white"
              >
                <option value={5}>5 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prize Pool</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R</span>
                <Input
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => setFormData(prev => ({ ...prev, prizePool: parseInt(e.target.value) }))}
                  className="pl-8"
                  min={0}
                  step={100}
                />
              </div>
            </div>
          </div>
          
          {/* Monthly Final */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isMonthlyFinal"
              checked={formData.isMonthlyFinal}
              onChange={(e) => setFormData(prev => ({ ...prev, isMonthlyFinal: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-white/5"
            />
            <label htmlFor="isMonthlyFinal" className="text-sm text-gray-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-ggza-gold" />
              This is a Monthly Final (extra prizes)
            </label>
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Quiz
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

