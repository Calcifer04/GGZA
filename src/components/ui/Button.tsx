'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'gold', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ggza-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ggza-black'
    
    const variants = {
      gold: 'bg-gradient-to-r from-ggza-gold to-amber-500 text-ggza-black hover:shadow-gold hover:-translate-y-0.5 active:translate-y-0',
      outline: 'border-2 border-ggza-gold/50 text-ggza-gold hover:bg-ggza-gold/10 hover:border-ggza-gold',
      ghost: 'text-gray-300 hover:text-white hover:bg-white/5',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

