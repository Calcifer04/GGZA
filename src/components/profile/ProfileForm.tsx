'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { Check, Gamepad2 } from 'lucide-react'
import type { User, Game } from '@/types/database'

interface ProfileFormProps {
  user: User
  allGames: Game[]
  selectedGameIds: string[]
}

export function ProfileForm({ user, allGames, selectedGameIds }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    mobile: user.mobile || '',
    newsletterOptIn: user.newsletter_opt_in,
    whatsappOptIn: user.whatsapp_opt_in,
    selectedGames: selectedGameIds,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleGame = (gameId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGames: prev.selectedGames.includes(gameId)
        ? prev.selectedGames.filter(id => id !== gameId)
        : [...prev.selectedGames, gameId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok) throw new Error('Failed to update profile')
      
      setMessage('Profile updated successfully!')
      router.refresh()
    } catch (error) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Personal Information</h3>
        
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
            />
          </div>
          
          <Input
            label="Mobile Number"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleInputChange}
            hint="Used for prize notifications"
          />
          
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Games You Follow
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {allGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => toggleGame(game.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                    ${formData.selectedGames.includes(game.id)
                      ? 'border-ggza-gold bg-ggza-gold/5'
                      : 'border-white/10 hover:border-white/20'}
                  `}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${game.color}20` }}
                  >
                    <Gamepad2 className="w-5 h-5" style={{ color: game.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{game.display_name}</div>
                  </div>
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${formData.selectedGames.includes(game.id)
                      ? 'border-ggza-gold bg-ggza-gold'
                      : 'border-white/20'}
                  `}>
                    {formData.selectedGames.includes(game.id) && (
                      <Check className="w-3 h-3 text-ggza-black" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Preferences */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Notification Preferences
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="newsletterOptIn"
                checked={formData.newsletterOptIn}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
              />
              <span className="text-sm text-gray-400">
                Receive quiz reminders and updates via email
              </span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="whatsappOptIn"
                checked={formData.whatsappOptIn}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
              />
              <span className="text-sm text-gray-400">
                Receive quiz reminders via WhatsApp
              </span>
            </label>
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('success') 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {message}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </form>
  )
}

