'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-ggza-black-lighter border rounded-xl text-white placeholder:text-gray-500 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ggza-gold/50 focus:border-ggza-gold/50',
            error ? 'border-red-500' : 'border-white/10 hover:border-white/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }

