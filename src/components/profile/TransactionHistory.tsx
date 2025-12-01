'use client'

import { useState } from 'react'
import { Card, Badge } from '@/components/ui'
import { Wallet, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payout, QuizScore } from '@/types/database'

interface TransactionHistoryProps {
  payouts: Payout[]
  scores: (QuizScore & { quiz: any })[]
}

export function TransactionHistory({ payouts, scores }: TransactionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'payouts' | 'scores'>('payouts')

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Transaction History</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'payouts' 
                ? 'bg-ggza-gold/20 text-ggza-gold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Payouts
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'scores' 
                ? 'bg-ggza-gold/20 text-ggza-gold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Quiz Results
          </button>
        </div>
      </div>
      
      {activeTab === 'payouts' && (
        <div className="space-y-3">
          {payouts.length > 0 ? (
            payouts.map((payout) => (
              <div 
                key={payout.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${payout.status === 'completed' ? 'bg-green-500/20' : 'bg-amber-500/20'}
                  `}>
                    {payout.status === 'completed' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">Prize Payout</div>
                    <div className="text-sm text-gray-500">{formatDate(payout.created_at)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">+{formatCurrency(payout.amount)}</div>
                  <Badge 
                    variant={payout.status === 'completed' ? 'success' : 'warning'} 
                    size="sm"
                  >
                    {payout.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No payouts yet</p>
              <p className="text-sm text-gray-600">Win quizzes to earn cash prizes!</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'scores' && (
        <div className="space-y-3">
          {scores.length > 0 ? (
            scores.map((score) => (
              <div 
                key={score.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${score.quiz?.game?.color}20` }}
                  >
                    <Trophy className="w-5 h-5" style={{ color: score.quiz?.game?.color }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{score.quiz?.title}</div>
                    <div className="text-sm text-gray-500">
                      {score.quiz?.game?.display_name} • {formatDate(score.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-ggza-gold">{score.total_points} pts</div>
                  <div className="text-sm text-gray-500">
                    {score.correct_answers}/{score.total_questions} correct
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No quiz results yet</p>
              <p className="text-sm text-gray-600">Join a quiz to see your scores!</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

