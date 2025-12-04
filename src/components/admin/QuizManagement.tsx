'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import { Calendar, Settings, Filter } from 'lucide-react'
import { formatCurrency, formatDate, DAY_NAMES } from '@/lib/utils'
import { CreateQuizForm } from './CreateQuizForm'
import { QuizActions } from './QuizActions'

interface QuizManagementProps {
  games: any[]
  quizzes: any[]
}

const GAME_SHORT_NAMES: Record<string, string> = {
  cs2: 'CS2',
  valorant: 'VAL',
  fifa: 'FIFA',
  fortnite: 'FN',
  apex: 'APEX',
}

export function QuizManagement({ games, quizzes }: QuizManagementProps) {
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredQuizzes = quizzes.filter(quiz => {
    if (gameFilter !== 'all' && quiz.game?.slug !== gameFilter) return false
    if (statusFilter !== 'all' && quiz.status !== statusFilter) return false
    return true
  })

  const upcomingCount = quizzes.filter(q => q.status === 'scheduled' && new Date(q.scheduled_at) > new Date()).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="warning">Scheduled</Badge>
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-white mb-2">Quiz Management</h1>
          <p className="text-gray-400">{upcomingCount} quizzes scheduled</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/questions">
            <Button variant="outline">Question Bank</Button>
          </Link>
          <CreateQuizForm games={games} />
        </div>
      </div>
      
      {/* Weekly Schedule Overview */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
        <div className="grid grid-cols-5 gap-4">
          {games.map((game: any) => {
            const nextQuiz = quizzes.find(
              (q: any) => q.game_id === game.id && 
              q.status === 'scheduled' && 
              new Date(q.scheduled_at) > new Date()
            )
            
            return (
              <button
                key={game.id}
                onClick={() => setGameFilter(gameFilter === game.slug ? 'all' : game.slug)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  gameFilter === game.slug 
                    ? 'border-ggza-gold bg-ggza-gold/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{ borderLeftColor: game.color, borderLeftWidth: 4 }}
              >
                <div className="text-sm text-gray-400">{DAY_NAMES[game.quiz_day]}</div>
                <div className="font-semibold text-white">{GAME_SHORT_NAMES[game.slug] || game.slug.toUpperCase()}</div>
                <div className="text-xs text-gray-500 mt-1">7PM SAST</div>
                {nextQuiz ? (
                  <div className="mt-2 text-xs text-green-400">
                    Next: {formatDate(nextQuiz.scheduled_at)}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-amber-400">
                    No quiz scheduled
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Filters:</span>
        </div>
        
        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="px-3 py-2 bg-ggza-black-lighter border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Games</option>
          {games.map((game: any) => (
            <option key={game.slug} value={game.slug}>
              {GAME_SHORT_NAMES[game.slug] || game.display_name}
            </option>
          ))}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-ggza-black-lighter border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        {(gameFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setGameFilter('all'); setStatusFilter('all') }}
            className="text-sm text-ggza-gold hover:underline"
          >
            Clear filters
          </button>
        )}
        
        <span className="text-sm text-gray-500 ml-auto">
          Showing {filteredQuizzes.length} of {quizzes.length} quizzes
        </span>
      </div>
      
      {/* Quizzes List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Quiz</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Game</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Scheduled</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">Questions</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">Players</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Prize</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map((quiz: any) => (
                <tr key={quiz.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-medium text-white">{quiz.title}</div>
                    <div className="text-sm text-gray-500">Week {quiz.week_number}, {quiz.year}</div>
                  </td>
                  <td className="p-4">
                    <span 
                      className="inline-flex px-2 py-1 rounded text-xs font-bold"
                      style={{ 
                        backgroundColor: `${quiz.game?.color}20`, 
                        color: quiz.game?.color 
                      }}
                    >
                      {GAME_SHORT_NAMES[quiz.game?.slug] || quiz.game?.slug?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-white">{formatDate(quiz.scheduled_at)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(quiz.scheduled_at).toLocaleTimeString('en-ZA', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={quiz.quiz_questions?.[0]?.count >= quiz.question_count ? 'text-green-400' : 'text-amber-400'}>
                      {quiz.quiz_questions?.[0]?.count || 0}/{quiz.question_count}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-400">
                    {quiz.quiz_scores?.[0]?.count || 0}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-ggza-gold font-semibold">
                      {formatCurrency(quiz.prize_pool)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(quiz.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/quizzes/${quiz.id}`}>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                      <QuizActions quiz={quiz} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredQuizzes.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {quizzes.length === 0 ? 'No quizzes created yet' : 'No quizzes match your filters'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

