'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Input } from '@/components/ui'
import { Search, Filter, Gamepad2, ArrowLeft } from 'lucide-react'
import { QuestionForm } from './QuestionForm'
import { BulkQuestionImport } from './BulkQuestionImport'

interface QuestionBankManagerProps {
  games: any[]
  questions: any[]
  countsByGame: Record<string, number>
}

const GAME_SHORT_NAMES: Record<string, string> = {
  cs2: 'CS2',
  valorant: 'VAL',
  fifa: 'FIFA',
  fortnite: 'FN',
  apex: 'APEX',
}

export function QuestionBankManager({ games, questions, countsByGame }: QuestionBankManagerProps) {
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredQuestions = questions.filter(q => {
    if (gameFilter !== 'all' && q.game?.slug !== gameFilter) return false
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
    if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalQuestions = questions.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link 
        href="/admin/quizzes" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-white mb-2">Question Bank</h1>
          <p className="text-gray-400">{totalQuestions} total questions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <BulkQuestionImport games={games} />
          <QuestionForm games={games} />
        </div>
      </div>
      
      {/* Game Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {games.map((game: any) => (
          <button
            key={game.id}
            onClick={() => setGameFilter(gameFilter === game.slug ? 'all' : game.slug)}
            className={`p-4 rounded-xl border text-left transition-all ${
              gameFilter === game.slug 
                ? 'border-ggza-gold bg-ggza-gold/10' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: game.color }}
            >
              {countsByGame[game.id] || 0}
            </div>
            <div className="text-sm text-gray-400">
              {GAME_SHORT_NAMES[game.slug] || game.slug.toUpperCase()}
            </div>
          </button>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
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
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 bg-ggza-black-lighter border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        
        {(gameFilter !== 'all' || difficultyFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setGameFilter('all'); setDifficultyFilter('all'); setSearchQuery('') }}
            className="text-sm text-ggza-gold hover:underline"
          >
            Clear
          </button>
        )}
        
        <span className="text-sm text-gray-500">
          {filteredQuestions.length} questions
        </span>
      </div>
      
      {/* Questions List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Question</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 w-20">Game</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 w-24">Difficulty</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 w-20">Used</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 w-24">Success</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question: any) => {
                const successRate = question.times_used > 0 
                  ? Math.round((question.times_correct / question.times_used) * 100)
                  : 0
                  
                return (
                  <tr key={question.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="text-white">{question.question_text}</div>
                      {question.category && (
                        <div className="text-xs text-gray-500 mt-1">{question.category}</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span 
                        className="inline-flex px-2 py-1 rounded text-xs font-bold"
                        style={{ 
                          backgroundColor: `${question.game?.color}20`, 
                          color: question.game?.color 
                        }}
                      >
                        {GAME_SHORT_NAMES[question.game?.slug] || question.game?.slug?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
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
                    <td className="p-4 text-center text-gray-400">{question.times_used}</td>
                    <td className="p-4 text-center">
                      <span className={successRate > 50 ? 'text-green-400' : successRate > 0 ? 'text-red-400' : 'text-gray-500'}>
                        {question.times_used > 0 ? `${successRate}%` : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex w-2 h-2 rounded-full ${question.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredQuestions.length === 0 && (
          <div className="p-12 text-center">
            <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {questions.length === 0 ? 'No questions yet' : 'No questions match your filters'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Use "Bulk Import" to add questions quickly
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

