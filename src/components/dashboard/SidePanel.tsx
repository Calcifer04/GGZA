'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Activity, Star } from 'lucide-react'
import { LivePlayerCount } from './LivePlayerCount'
import { DailyMissions } from './DailyMissions'

export function SidePanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="fixed top-24 right-0 z-40 hidden xl:block">
      {/* Toggle Button - Fixed at right edge */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          absolute top-0 right-0 flex flex-col items-center gap-2 px-1.5 py-3 
          bg-ggza-black-lighter border border-white/10 border-r-0
          rounded-l-xl shadow-lg transition-all duration-300
          hover:bg-ggza-black-light hover:border-ggza-gold/30
          ${isCollapsed ? 'translate-x-0' : 'translate-x-[-288px]'}
        `}
      >
        {isCollapsed ? (
          <>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <div className="flex flex-col gap-1.5">
              <div className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center">
                <Activity className="w-3 h-3 text-green-400" />
              </div>
              <div className="w-6 h-6 rounded-md bg-ggza-gold/20 flex items-center justify-center">
                <Star className="w-3 h-3 text-ggza-gold" />
              </div>
            </div>
          </>
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Panel Content */}
      <div 
        className={`
          w-72 space-y-4 pr-4 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}
        `}
      >
        <LivePlayerCount />
        <DailyMissions />
      </div>
    </div>
  )
}

export default SidePanel

