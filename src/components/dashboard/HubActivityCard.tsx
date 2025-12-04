'use client'

import { Users, Gamepad2, Circle, TrendingUp } from 'lucide-react'
import { useLiveActivity } from '@/lib/hooks'

interface HubActivityCardProps {
  gameSlug: string
  gameName: string
  gameColor: string
}

export function HubActivityCard({ gameSlug, gameName, gameColor }: HubActivityCardProps) {
  const { data, loading, isConnected } = useLiveActivity()
  
  const hubData = data.hubs.find(h => h.slug === gameSlug)
  const onlineCount = hubData?.count || 0
  
  // Calculate rank among hubs
  const sortedHubs = [...data.hubs].sort((a, b) => b.count - a.count)
  const rank = sortedHubs.findIndex(h => h.slug === gameSlug) + 1
  const isTopHub = rank === 1 && onlineCount > 0

  return (
    <div 
      className="rounded-xl p-4 border transition-all"
      style={{ 
        backgroundColor: `${gameColor}10`,
        borderColor: `${gameColor}30`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${gameColor}20` }}
          >
            <Gamepad2 className="w-4 h-4" style={{ color: gameColor }} />
          </div>
          <span className="text-sm font-medium text-white">{gameName} Hub</span>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
          </span>
          <span className={`text-[10px] font-medium ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            LIVE
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Online count */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${gameColor}15` }}
          >
            <Users className="w-5 h-5" style={{ color: gameColor }} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span 
                className="text-2xl font-bold"
                style={{ color: gameColor }}
              >
                {loading ? '—' : onlineCount}
              </span>
              {onlineCount > 0 && (
                <Circle 
                  className="w-2 h-2 fill-current animate-pulse" 
                  style={{ color: gameColor }} 
                />
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-gray-500">
              Online in Hub
            </span>
          </div>
        </div>

        {/* Rank badge */}
        {!loading && onlineCount > 0 && (
          <div 
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
              ${isTopHub ? 'bg-ggza-gold/20 text-ggza-gold' : 'bg-white/5 text-gray-400'}
            `}
          >
            {isTopHub ? (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                Most Active
              </>
            ) : (
              <>#{rank} hub</>
            )}
          </div>
        )}
      </div>

      {/* Activity bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>Hub Activity</span>
          <span>{Math.round((onlineCount / Math.max(data.totalOnline, 1)) * 100)}% of online</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min((onlineCount / Math.max(data.totalOnline, 1)) * 100, 100)}%`,
              backgroundColor: gameColor,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default HubActivityCard

