'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, XCircle, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui'

interface QuizActionsProps {
  quiz: {
    id: string
    status: string
    title: string
  }
}

export function QuizActions({ quiz }: QuizActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const updateStatus = async (status: 'live' | 'completed' | 'cancelled') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update quiz')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  if (quiz.status === 'completed' || quiz.status === 'cancelled') {
    return null
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowMenu(!showMenu)}
        loading={loading}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-ggza-black-light border border-white/10 shadow-xl z-20 overflow-hidden">
            {quiz.status === 'scheduled' && (
              <button
                onClick={() => updateStatus('live')}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-green-400" />
                Start Quiz Now
              </button>
            )}
            {quiz.status === 'live' && (
              <button
                onClick={() => updateStatus('completed')}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Pause className="w-4 h-4 text-amber-400" />
                End Quiz
              </button>
            )}
            {quiz.status === 'scheduled' && (
              <button
                onClick={() => updateStatus('cancelled')}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel Quiz
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

