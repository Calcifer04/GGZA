'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownProps {
  targetDate: Date | string
  onComplete?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now()
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  }
}

export function Countdown({ targetDate, onComplete, className, variant = 'default' }: CountdownProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(target))
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(target)
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [target, onComplete])

  if (!hasMounted) {
    return null
  }

  if (timeLeft.total <= 0) {
    return (
      <div className={cn('text-ggza-gold font-bold animate-pulse', className)}>
        LIVE NOW!
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('font-mono text-ggza-gold', className)}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    )
  }

  if (variant === 'large') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="Days" />
        )}
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <TimeUnit value={timeLeft.seconds} label="Secs" urgent={timeLeft.total < 60000} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {timeLeft.days > 0 && (
        <TimeUnitSmall value={timeLeft.days} label="D" />
      )}
      <TimeUnitSmall value={timeLeft.hours} label="H" />
      <TimeUnitSmall value={timeLeft.minutes} label="M" />
      <TimeUnitSmall value={timeLeft.seconds} label="S" urgent={timeLeft.total < 60000} />
    </div>
  )
}

function TimeUnit({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center p-4 rounded-xl bg-ggza-black-lighter border border-white/10',
      urgent && 'border-ggza-gold/50 timer-urgent'
    )}>
      <span className="text-4xl font-display text-ggza-gold">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

function TimeUnitSmall({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-1 px-3 py-2 rounded-lg bg-ggza-black-lighter border border-white/10',
      urgent && 'border-ggza-gold/50'
    )}>
      <span className="text-xl font-mono font-bold text-ggza-gold">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

