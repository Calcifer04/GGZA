'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, CheckCircle2, AlertCircle, Info, Trophy, Star, Flame, 
  Zap, Gift, Medal, Crown, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'achievement' | 'xp' | 'level-up' | 'streak'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  icon?: ReactNode
  xp?: number
  level?: number
  streak?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  // Convenience methods
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  achievement: (title: string, xp?: number) => void
  xpGain: (amount: number, reason?: string) => void
  levelUp: (level: number) => void
  streakUpdate: (days: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

// Toast icons by type
const typeIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  achievement: <Trophy className="w-5 h-5" />,
  xp: <Zap className="w-5 h-5" />,
  'level-up': <Star className="w-5 h-5" />,
  streak: <Flame className="w-5 h-5" />,
}

// Toast styles by type
const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    title: 'text-green-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    title: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    title: 'text-blue-400',
  },
  achievement: {
    bg: 'bg-gradient-to-r from-ggza-gold/20 to-amber-500/10',
    border: 'border-ggza-gold/40',
    icon: 'text-ggza-gold',
    title: 'text-ggza-gold',
  },
  xp: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    title: 'text-purple-400',
  },
  'level-up': {
    bg: 'bg-gradient-to-r from-ggza-gold/20 via-amber-500/20 to-yellow-500/10',
    border: 'border-ggza-gold/50',
    icon: 'text-ggza-gold',
    title: 'text-ggza-gold',
  },
  streak: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    title: 'text-orange-400',
  },
}

// Single toast component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const styles = typeStyles[toast.type]

  useEffect(() => {
    const duration = toast.duration ?? 5000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onRemove, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onRemove, 300)
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        styles.bg,
        styles.border,
        isExiting 
          ? 'opacity-0 translate-x-full' 
          : 'opacity-100 translate-x-0 animate-in slide-in-from-right-full'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
        {toast.icon || typeIcons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('font-semibold', styles.title)}>{toast.title}</p>
          {toast.xp && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
              <Zap className="w-3 h-3" />
              +{toast.xp} XP
            </span>
          )}
        </div>
        {toast.message && (
          <p className="text-sm text-gray-400 mt-0.5">{toast.message}</p>
        )}
        {toast.level && (
          <p className="text-sm text-ggza-gold mt-1 flex items-center gap-1">
            <Crown className="w-4 h-4" />
            You are now Level {toast.level}!
          </p>
        )}
        {toast.streak && (
          <p className="text-sm text-orange-400 mt-1 flex items-center gap-1">
            <Flame className="w-4 h-4" />
            {toast.streak} day streak!
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Special effects for achievements */}
      {(toast.type === 'achievement' || toast.type === 'level-up') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-ggza-gold/30 animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-ggza-gold/20 animate-pulse delay-150" />
        </div>
      )}
    </div>
  )
}

// Toast container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>,
    document.body
  )
}

// Provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  const achievement = useCallback((title: string, xp?: number) => {
    addToast({ 
      type: 'achievement', 
      title: '🏆 Achievement Unlocked!',
      message: title,
      xp,
      duration: 6000,
    })
  }, [addToast])

  const xpGain = useCallback((amount: number, reason?: string) => {
    addToast({ 
      type: 'xp', 
      title: `+${amount} XP`,
      message: reason,
      duration: 3000,
    })
  }, [addToast])

  const levelUp = useCallback((level: number) => {
    addToast({ 
      type: 'level-up', 
      title: '⭐ Level Up!',
      level,
      duration: 7000,
    })
  }, [addToast])

  const streakUpdate = useCallback((days: number) => {
    addToast({ 
      type: 'streak', 
      title: '🔥 Streak Updated!',
      streak: days,
      duration: 4000,
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      removeToast,
      success,
      error,
      info,
      achievement,
      xpGain,
      levelUp,
      streakUpdate,
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default ToastProvider

