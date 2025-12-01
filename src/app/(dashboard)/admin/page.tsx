import Link from 'next/link'
import { 
  Users, 
  Gamepad2, 
  HelpCircle, 
  Trophy, 
  Wallet, 
  Shield, 
  FileText,
  BarChart3,
  Settings
} from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { Card, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

async function getAdminStats() {
  const supabase = createAdminSupabaseClient()
  
  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: totalQuizzes },
    { count: pendingPayouts },
    { count: openTickets },
    { count: activeStrikes },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase.from('payouts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('strikes').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])
  
  // Get recent activity
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('*, actor:users(discord_username)')
    .order('created_at', { ascending: false })
    .limit(10)
  
  return {
    totalUsers: totalUsers || 0,
    verifiedUsers: verifiedUsers || 0,
    totalQuizzes: totalQuizzes || 0,
    pendingPayouts: pendingPayouts || 0,
    openTickets: openTickets || 0,
    activeStrikes: activeStrikes || 0,
    recentLogs: recentLogs || [],
  }
}

const ADMIN_SECTIONS = [
  { href: '/admin/users', label: 'User Management', icon: Users, description: 'View and manage users, roles, and verification' },
  { href: '/admin/quizzes', label: 'Quiz Management', icon: Gamepad2, description: 'Create quizzes, manage question bank' },
  { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle, description: 'Add and manage quiz questions' },
  { href: '/admin/leaderboards', label: 'Leaderboards', icon: Trophy, description: 'View and manage leaderboards' },
  { href: '/admin/payouts', label: 'Payouts', icon: Wallet, description: 'Process winner payouts' },
  { href: '/admin/strikes', label: 'Strikes & Bans', icon: Shield, description: 'Manage user strikes and appeals' },
  { href: '/admin/tickets', label: 'Support Tickets', icon: FileText, description: 'Handle support requests' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, description: 'View platform statistics' },
]

export default async function AdminPage() {
  const user = await requireAdmin()
  const stats = await getAdminStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage GGZA platform operations</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </Card>
        
        <Card className="p-4">
          <Shield className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.verifiedUsers}</div>
          <div className="text-sm text-gray-500">Verified</div>
        </Card>
        
        <Card className="p-4">
          <Gamepad2 className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalQuizzes}</div>
          <div className="text-sm text-gray-500">Quizzes</div>
        </Card>
        
        <Card className="p-4">
          <Wallet className="w-6 h-6 text-ggza-gold mb-2" />
          <div className="text-2xl font-bold text-white">{stats.pendingPayouts}</div>
          <div className="text-sm text-gray-500">Pending Payouts</div>
        </Card>
        
        <Card className="p-4">
          <FileText className="w-6 h-6 text-amber-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.openTickets}</div>
          <div className="text-sm text-gray-500">Open Tickets</div>
        </Card>
        
        <Card className="p-4">
          <Shield className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.activeStrikes}</div>
          <div className="text-sm text-gray-500">Active Strikes</div>
        </Card>
      </div>
      
      {/* Admin Sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ADMIN_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card interactive className="h-full">
              <section.icon className="w-8 h-8 text-ggza-gold mb-3" />
              <h3 className="font-semibold text-white mb-1">{section.label}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        
        <div className="space-y-3">
          {stats.recentLogs.map((log: any) => (
            <div 
              key={log.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-ggza-gold" />
                <div>
                  <span className="text-white">{log.action}</span>
                  {log.actor && (
                    <span className="text-gray-500 ml-2">
                      by @{log.actor.discord_username}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          
          {stats.recentLogs.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  )
}

