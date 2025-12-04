'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Gamepad2, 
  Trophy, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, LevelBadge } from '@/components/ui'
import type { Session } from '@/lib/auth'

interface DashboardNavProps {
  session: Session
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Play },
  { href: '/hub', label: 'Game Hubs', icon: Gamepad2 },
  { href: '/leaderboard', label: 'Leaderboards', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Admin', icon: Shield },
]

export function DashboardNav({ session }: DashboardNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isAdmin = ['admin', 'community_manager', 'quiz_master', 'bot_dev', 'moderator'].includes(session.role)
  
  const allItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ggza-gold to-amber-500 flex items-center justify-center">
                <span className="font-display text-sm text-ggza-black">GG</span>
              </div>
              <span className="font-display text-xl text-white hidden sm:block">GGZA</span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {allItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-ggza-gold/10 text-ggza-gold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <LevelBadge size="sm" />
                <Avatar
                  discordId={session.discordId}
                  avatarHash={session.discordAvatar}
                  username={session.discordUsername}
                  size="sm"
                />
                <span className="text-sm text-gray-300">{session.discordUsername}</span>
              </div>
              
              <a
                href="/api/auth/logout"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </a>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-ggza-black-light border-b border-white/5 p-4">
            <div className="flex flex-col gap-2">
              {allItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-ggza-gold/10 text-ggza-gold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

