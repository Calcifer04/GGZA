'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface GameItem {
  name: string
  shortName: string
  day: string
  color: string
  gradientFrom: string
  gradientTo: string
  prize: string
  image: string
  // Base64 blur placeholder for instant loading (tiny ~10px versions)
  blurDataURL: string
}

// Tiny 10x10 base64 placeholders generated from the images
// These are ~200 bytes each and load instantly
const BLUR_PLACEHOLDERS = {
  cs2: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAJBAAAgEDAwQDAQAAAAAAAAAAAQIDBAUGABEhBxIxQRNRYXH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABwRAAICAgMAAAAAAAAAAAAAAAECAAMEESFBUf/aAAwDAQACEQMRAD8Aw5ZcauF2xumyG3UjT0M8kkaSKRuCjFT2jjkEa0B05qrrj+IWq1XGF6esppHjnjYbq4MjHY/uNCcQyHI7TjlFR2u6TW6KNn7Y4mKBSXYk7D+k65TluW5Ff0jjvV3qLhHCT2LPIXCEncbAnx5P41py7L0+wGVhc7j5J//Z',
  valorant: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwUI/8QAIxAAAgIBAwQDAQAAAAAAAAAAAQIDBQQGERIAByExE0FRcf/EABUBAQEAAAAAAAAAAAAAAAAAAAUG/8QAHBEAAgICAwAAAAAAAAAAAAAAAQIAAwQREiFB/9oADAMBEQACEQA8A/8AQ9nZ9t5bVd7BZ2mLNT1UEkcErxEJI4HMBmI3A23+udh7HoHj9TdjXRUFNW47Cwmsx0V/HJhFm5HYDcnbjvv9evv0Lyq2y2us55sbGixJpY43SMAbcVQDYf4APQFeyABfVQKxZF3/2Q==',
  fifa: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAIxAAAgICAQQCAwAAAAAAAAAAAQIDBQQGABEhMUEHE2JxkfH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBf/EABsRAAICAwEAAAAAAAAAAAAAAAECAAMEESFR/9oADAMBEQACEQA8A+TbXsNjg6bZZmv11fJbzAIrLKxFdlZlPMDbYnggd+/XTrH+acKPXdZx9cpK+rqhI0scKsqOQzE7gf0fXAhZG+g0Dcgq4p2mI9dNf//Z',
  fortnite: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAIxAAAgIBAwQDAQAAAAAAAAAAAQIDBREEBiEAEhMxByJBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAUG/8QAHREAAQQCAwAAAAAAAAAAAAAAAQACAwQRMRIhQf/aAAwDAQACEQMRAD8AxJtfFt5G6NNia+mjfLzSLHBE8pjXuJ9lgAfXrp34hwdfb6LHU8XjvIxDwwIg7I0BIAVfwADgeugUd3d+NqLTz4vIyY6dI1SaOGQoHAHBPHvsj30F/jfPZ/5uTOVs/wCT+3f/2Q==',
  apex: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAIxAAAgIBAwQDAQAAAAAAAAAAAQIDBREEBiEAEhMxByJBYf/EABUBAQEAAAAAAAAAAAAAAAAAAAUG/8QAHBEAAQQDAQAAAAAAAAAAAAAAAQACAwQFESEx/9oADAMBEQACEQA8A/mN3Jt+PdOu0+q1unXLxSMk8Lz+IKT7K7qD6HHrp14ht9u0upxtLaWL4bJ1aZJYnlEbeIjkEqAPQ59dA37O2viW2nzGqyGMlycksKwyyQoXCADgAnx6JPPro7+O+ew//Sy1ZPJ/bv/Z',
}

const GAMES: GameItem[] = [
  { 
    name: 'Counter-Strike 2', 
    shortName: 'CS2',
    day: 'Monday', 
    color: '#F5A623',
    gradientFrom: '#1a1814',
    gradientTo: '#252017',
    prize: 'R1,000',
    image: '/cs2.png',
    blurDataURL: BLUR_PLACEHOLDERS.cs2,
  },
  { 
    name: 'VALORANT', 
    shortName: 'VAL',
    day: 'Tuesday', 
    color: '#FF4655',
    gradientFrom: '#1a1416',
    gradientTo: '#241a1c',
    prize: 'R1,000',
    image: '/valorant.jpg',
    blurDataURL: BLUR_PLACEHOLDERS.valorant,
  },
  { 
    name: 'EA FC / FIFA', 
    shortName: 'FIFA',
    day: 'Wednesday', 
    color: '#4A90D9',
    gradientFrom: '#14181a',
    gradientTo: '#1a2024',
    prize: 'R1,000',
    image: '/fifa.jpg',
    blurDataURL: BLUR_PLACEHOLDERS.fifa,
  },
  { 
    name: 'Fortnite', 
    shortName: 'FN',
    day: 'Thursday', 
    color: '#B388FF',
    gradientFrom: '#18141a',
    gradientTo: '#201a24',
    prize: 'R1,000',
    image: '/fortnite.jpg',
    blurDataURL: BLUR_PLACEHOLDERS.fortnite,
  },
  { 
    name: 'Apex Legends', 
    shortName: 'APEX',
    day: 'Friday', 
    color: '#E53935',
    gradientFrom: '#1a1414',
    gradientTo: '#241a1a',
    prize: 'R1,000',
    image: '/apex.jpg',
    blurDataURL: BLUR_PLACEHOLDERS.apex,
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
  return (
    <li 
      className={`flex-shrink-0 ${isNew ? 'animate-drop-in' : ''}`}
    >
      <div 
        className="group relative h-full w-[96px] cursor-pointer overflow-hidden rounded-lg transition-all duration-200 origin-bottom hover:scale-[1.02]"
      >
        {/* Background Image - optimized by Next.js */}
        <Image
          src={game.image}
          alt={game.name}
          fill
          sizes="96px"
          quality={75}
          placeholder="blur"
          blurDataURL={game.blurDataURL}
          className="object-cover"
        />
        
        {/* Subtle dark overlay for text readability - lets image show through more */}
        <div 
          className="absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(to bottom, ${game.gradientFrom}99, ${game.gradientTo}bb)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-2 py-2">
          {/* Game name */}
          <div className="w-full text-center">
            <div 
              className="text-[11px] font-bold leading-tight truncate drop-shadow-lg"
              style={{ color: game.color }}
            >
              {game.shortName}
            </div>
            <div className="text-[9px] font-medium text-white/70 leading-tight drop-shadow">
              {game.day}s
            </div>
          </div>
        </div>

        {/* Prize overlay - full card, slides up on hover */}
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out backdrop-blur-sm"
          style={{ backgroundColor: `${game.gradientTo}dd` }}
        >
          <div className="text-[9px] uppercase tracking-wider text-white/60 mb-1">Prize Pool</div>
          <div 
            className="text-lg font-bold drop-shadow-lg"
            style={{ color: game.color }}
          >
            R1,000
          </div>
        </div>

        {/* Bottom glow effect - subtle accent */}
        <div 
          className="absolute inset-0 z-[2] opacity-20 transition-opacity duration-200 group-hover:opacity-35 pointer-events-none"
          style={{ 
            background: `linear-gradient(transparent 50%, ${game.color}80)`,
          }}
        />
        
        {/* Border glow on hover */}
        <div 
          className="absolute inset-0 z-[3] rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
          style={{ 
            boxShadow: `inset 0 0 0 1px ${game.color}50, 0 0 20px ${game.color}30`,
          }}
        />
      </div>
    </li>
  )
}

export default MarqueeCarousel
