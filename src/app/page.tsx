import Link from 'next/link'
import { Gamepad2, Trophy, Users, Zap, Calendar, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'

const GAMES = [
  { slug: 'cs2', name: 'Counter-Strike 2', color: '#DE9B35', day: 'Monday' },
  { slug: 'valorant', name: 'VALORANT', color: '#FD4556', day: 'Tuesday' },
  { slug: 'fifa', name: 'EA FC / FIFA', color: '#326295', day: 'Wednesday' },
  { slug: 'fortnite', name: 'Fortnite', color: '#9D4DFF', day: 'Thursday' },
  { slug: 'apex', name: 'Apex Legends', color: '#DA292A', day: 'Friday' },
]

const FEATURES = [
  {
    icon: Trophy,
    title: 'Weekly Cash Prizes',
    description: 'R1,000 weekly prize pools split between top 3 players. Monthly finals with R5,000 up for grabs.',
  },
  {
    icon: Gamepad2,
    title: '5 Game Hubs',
    description: 'Dedicated quiz nights for CS2, Valorant, FIFA, Fortnite, and Apex Legends every week.',
  },
  {
    icon: Users,
    title: 'SA Community',
    description: 'Built for South African gamers. Local pride, fair play, and zero toxicity.',
  },
  {
    icon: Zap,
    title: 'Fast-Paced Quizzes',
    description: '30 questions, 5 seconds each. Test your game knowledge under pressure.',
  },
  {
    icon: Calendar,
    title: 'Regular Events',
    description: 'Quiz nights every weekday at 7PM SAST. Never miss the action.',
  },
  {
    icon: Shield,
    title: 'Fair & Verified',
    description: 'Anti-cheat measures and SA verification ensure a level playing field.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ggza-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 geo-pattern opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-ggza-gold/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ggza-gold to-amber-500 flex items-center justify-center">
                <span className="font-display text-xl text-ggza-black">GG</span>
              </div>
              <span className="font-display text-2xl text-white">GGZA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Join Now</Button>
              </Link>
            </div>
          </nav>
        
          {/* Hero content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ggza-gold/10 border border-ggza-gold/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ggza-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ggza-gold"></span>
              </span>
              <span className="text-sm text-ggza-gold font-medium">Weekly quizzes live every weeknight</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-display mb-6">
              <span className="text-white">SA's Premier</span>
              <br />
              <span className="text-gradient-gold">Gaming Quiz Hub</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Test your game knowledge, compete against fellow South African gamers, and win cash prizes every week. Join the community that celebrates local gaming.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  <Gamepad2 className="w-5 h-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link href={process.env.NEXT_PUBLIC_DISCORD_INVITE || '#'}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Join Discord Server
                </Button>
              </Link>
            </div>
            
            {/* Prize callout */}
            <div className="mt-12 inline-flex items-center gap-6 px-8 py-4 rounded-2xl glass-gold">
              <div className="text-left">
                <div className="text-sm text-gray-400">Weekly Prizes</div>
                <div className="text-2xl font-display text-ggza-gold">R1,000</div>
              </div>
              <div className="w-px h-10 bg-ggza-gold/20" />
              <div className="text-left">
                <div className="text-sm text-gray-400">Monthly Finals</div>
                <div className="text-2xl font-display text-ggza-gold">R5,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Games Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display text-white mb-4">Choose Your Game</h2>
            <p className="text-gray-400">Five dedicated quiz nights, one for each title</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {GAMES.map((game) => (
              <div 
                key={game.slug}
                className="group relative p-6 rounded-2xl bg-ggza-black-lighter border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${game.color}10, transparent)` }}
                />
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${game.color}20` }}
                  >
                    <Gamepad2 className="w-6 h-6" style={{ color: game.color }} />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{game.name}</h3>
                  <p className="text-sm text-gray-500">{game.day}s @ 7PM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-white mb-4">Why GGZA?</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built by SA gamers, for SA gamers. Everything you need to prove you're the real deal.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-ggza-black-lighter border border-white/5 hover:border-ggza-gold/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-ggza-gold/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-ggza-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-white mb-4">How It Works</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Connect with Discord and verify your SA status' },
              { step: '02', title: 'Pick Games', desc: 'Choose the titles you want to compete in' },
              { step: '03', title: 'Play Quizzes', desc: '30 questions, 5 seconds each - test your knowledge' },
              { step: '04', title: 'Win Prizes', desc: 'Top the leaderboard and claim your cash prize' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-display text-ggza-gold/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display text-white mb-6">
            Ready to Prove Your<br />
            <span className="text-gradient-gold">Game Knowledge?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of South African gamers competing for cash prizes.
          </p>
          <Link href="/login">
            <Button size="lg">
              Start Playing
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ggza-gold to-amber-500 flex items-center justify-center">
                <span className="font-display text-sm text-ggza-black">GG</span>
              </div>
              <span className="font-display text-lg text-white">GGZA</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/rules" className="hover:text-white transition-colors">Rules</Link>
              <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 GGZA. Made with ❤️ in South Africa.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

