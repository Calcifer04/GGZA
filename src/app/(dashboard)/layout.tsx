import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { ReactionTest } from '@/components/ui'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen bg-ggza-black">
      <DashboardNav session={session} />
      <main className="pt-16">
        {children}
      </main>
      <ReactionTest />
    </div>
  )
}

