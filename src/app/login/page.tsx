'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Gamepad2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

const ERROR_MESSAGES: Record<string, string> = {
  discord_denied: 'Discord authorization was denied. Please try again.',
  missing_params: 'Missing authorization parameters. Please try again.',
  invalid_state: 'Invalid security state. Please try again.',
  no_email: 'We need access to your email. Please authorize email access.',
  create_failed: 'Failed to create account. Please try again.',
  user_not_found: 'User not found. Please try again.',
  auth_failed: 'Authentication failed. Please try again.',
  not_in_server: 'You must join our Discord server first to use GGZA. Join the server and try again.',
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const redirect = searchParams.get('redirect')
  
  const loginUrl = redirect 
    ? `/api/auth/discord?redirect=${encodeURIComponent(redirect)}`
    : '/api/auth/discord'

  return (
    <main className="min-h-screen bg-ggza-black flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 geo-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ggza-gold/5 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ggza-gold to-amber-500 flex items-center justify-center">
            <span className="font-display text-2xl text-ggza-black">GG</span>
          </div>
          <span className="font-display text-3xl text-white">GGZA</span>
        </Link>
        
        {/* Card */}
        <div className="p-8 rounded-2xl bg-ggza-black-lighter border border-white/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to GGZA</h1>
            <p className="text-gray-400">Sign in with Discord to start playing</p>
          </div>
          
          {/* Error message */}
          {error && ERROR_MESSAGES[error] && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-400">
                <p>{ERROR_MESSAGES[error]}</p>
                {error === 'not_in_server' && process.env.NEXT_PUBLIC_DISCORD_INVITE && (
                  <a 
                    href={process.env.NEXT_PUBLIC_DISCORD_INVITE} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-ggza-gold hover:underline"
                  >
                    → Join our Discord server
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Discord button */}
          <a href={loginUrl} className="block">
            <Button className="w-full" size="lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Continue with Discord
            </Button>
          </a>
          
          {/* Info */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3 text-sm text-gray-500">
              <Gamepad2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                By signing in, you'll be able to join our Discord server, participate in quizzes, and compete for cash prizes.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-ggza-gold hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-ggza-gold hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

