'use client'

import { useEffect, useRef, useState } from 'react'
import { Crosshair, Swords, Trophy, Crown, Flame } from 'lucide-react'

interface GameItem {
  name: string
  shortName: string
  day: string
  color: string
  gradientFrom: string
  gradientTo: string
  icon: React.ElementType
  prize: string
}

const GAMES: GameItem[] = [
  { 
    name: 'Counter-Strike 2', 
    shortName: 'CS2',
    day: 'Monday', 
    color: '#DE9B35',
    gradientFrom: '#2D2518',
    gradientTo: '#4A3A1F',
    icon: Crosshair,
    prize: 'R1,000'
  },
  { 
    name: 'VALORANT', 
    shortName: 'VAL',
    day: 'Tuesday', 
    color: '#FD4556',
    gradientFrom: '#2D1A1C',
    gradientTo: '#4A2429',
    icon: Swords,
    prize: 'R1,000'
  },
  { 
    name: 'EA FC / FIFA', 
    shortName: 'FIFA',
    day: 'Wednesday', 
    color: '#22C55E',
    gradientFrom: '#1A2D1E',
    gradientTo: '#244A2D',
    icon: Trophy,
    prize: 'R1,000'
  },
  { 
    name: 'Fortnite', 
    shortName: 'FN',
    day: 'Thursday', 
    color: '#9D4DFF',
    gradientFrom: '#231A2D',
    gradientTo: '#36244A',
    icon: Crown,
    prize: 'R1,000'
  },
  { 
    name: 'Apex Legends', 
    shortName: 'APEX',
    day: 'Friday', 
    color: '#DA292A',
    gradientFrom: '#2D1A1A',
    gradientTo: '#4A2424',
    icon: Flame,
    prize: 'R1,000'
  },
]

// Create initial items list - spread evenly, starting from index 1
// so first pop-in (index 0) won't duplicate the front item
const createInitialItems = () => {
  const items: GameItem[] = []
  // Start from index 1 (VALORANT) so first item is VAL, not CS2
  // This way when we pop in CS2 first, it won't be a duplicate
  for (let i = 0; i < 30; i++) {
    items.push(GAMES[(i + 1) % GAMES.length])
  }
  return items
}

export function MarqueeCarousel() {
  const [items, setItems] = useState<GameItem[]>(createInitialItems)
  const [isAnimating, setIsAnimating] = useState(false)
  const isPaused = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const sequenceIndex = useRef(0) // Starts at CS2, initial list starts at VAL - no dupe!
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    // Add new item periodically - cycles through games in sequence
    const addItem = () => {
      if (isPaused.current) return
      
      setIsAnimating(true)
      
      // Get next game in sequence (CS2 → VAL → FIFA → FN → APEX → repeat)
      const nextGame = GAMES[sequenceIndex.current]
      sequenceIndex.current = (sequenceIndex.current + 1) % GAMES.length
      
      setItems(prev => {
        const newItems = [nextGame, ...prev]
        // Keep list manageable
        if (newItems.length > 40) {
          return newItems.slice(0, 40)
        }
        return newItems
      })

      // Reset animation flag after animation completes
      setTimeout(() => setIsAnimating(false), 500)
    }

    // Add item every 1.5 seconds for better flow
    intervalRef.current = setInterval(addItem, 1500)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0)
    scrollLeft.current = scrollRef.current?.scrollLeft || 0
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 2
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }

  const handleMouseLeave = () => {
    isDragging.current = false
    isPaused.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }

  return (
    <div 
      className="relative h-[70px] w-full overflow-hidden bg-ggza-black-light/80 border-y border-white/5"
      onMouseEnter={() => isPaused.current = true}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-ggza-black to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-ggza-black to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="h-full py-2 px-2 overflow-x-auto scrollbar-hide cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <ul className="flex h-full gap-[6px] w-max">
          {items.map((game, index) => (
            <GameCard 
              key={`${index}-${game.shortName}`} 
              game={game} 
              isNew={index === 0 && isAnimating}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function GameCard({ game, isNew }: { game: GameItem; isNew: boolean }) {
  const Icon = game.icon

  return (
    <li 
      className={`flex-shrink-0 ${isNew ? 'animate-drop-in' : ''}`}
    >
      <div 
        className="group relative h-full w-[96px] cursor-pointer overflow-hidden rounded-lg transition-all duration-200 origin-bottom hover:scale-[1.02]"
        style={{
          background: `linear-gradient(to bottom, ${game.gradientFrom}, ${game.gradientTo})`,
        }}
      >
        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 px-2 py-2">
          {/* Icon badge */}
          <div 
            className="flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: `${game.color}30` }}
          >
            <Icon 
              className="h-3.5 w-3.5 transition-all duration-200 group-hover:rotate-12" 
              style={{ color: game.color }} 
            />
          </div>
          
          {/* Game name */}
          <div className="w-full text-center">
            <div 
              className="text-[11px] font-bold leading-tight truncate"
              style={{ color: game.color }}
            >
              {game.shortName}
            </div>
            <div className="text-[9px] font-medium text-white/50 leading-tight">
              {game.day}s
            </div>
          </div>
        </div>

        {/* Prize overlay - full card, slides up on hover */}
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
          style={{ backgroundColor: `${game.gradientTo}ee` }}
        >
          <div className="text-[9px] uppercase tracking-wider text-white/60 mb-1">Prize Pool</div>
          <div 
            className="text-lg font-bold"
            style={{ color: game.color }}
          >
            R1,000
          </div>
        </div>

        {/* Bottom glow effect */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-200 group-hover:opacity-40 pointer-events-none"
          style={{ 
            background: `linear-gradient(transparent 40%, ${game.color})`,
          }}
        />
        
        {/* Border glow on hover */}
        <div 
          className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
          style={{ 
            boxShadow: `inset 0 0 0 1px ${game.color}50, 0 0 20px ${game.color}30`,
          }}
        />
      </div>
    </li>
  )
}

export default MarqueeCarousel
