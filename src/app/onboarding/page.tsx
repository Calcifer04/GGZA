'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Gamepad2, Shield, User, Loader2 } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

const GAMES = [
  { slug: 'cs2', name: 'Counter-Strike 2', color: '#DE9B35' },
  { slug: 'valorant', name: 'VALORANT', color: '#FD4556' },
  { slug: 'fifa', name: 'EA FC / FIFA', color: '#326295' },
  { slug: 'fortnite', name: 'Fortnite', color: '#9D4DFF' },
  { slug: 'apex', name: 'Apex Legends', color: '#DA292A' },
]

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Select Games', icon: Gamepad2 },
  { id: 3, title: 'SA Verification', icon: Shield },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    dateOfBirth: '',
    selectedGames: [] as string[],
    tosAccepted: false,
    popiaAccepted: false,
    newsletterOptIn: false,
    whatsappOptIn: false,
    challengeAnswer: null as number | null,
  })
  
  // SA Challenge question (would be fetched from API)
  const [challenge] = useState({
    question: 'What is "lekker" commonly used to describe in South African slang?',
    options: ['Something bad', 'Something nice/great', 'A type of food', 'A greeting'],
    correctIndex: 1,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const toggleGame = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGames: prev.selectedGames.includes(slug)
        ? prev.selectedGames.filter(g => g !== slug)
        : [...prev.selectedGames, slug],
    }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName.trim()) {
        setError('First name is required')
        return false
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required')
        return false
      }
      if (!formData.mobile.trim()) {
        setError('Mobile number is required')
        return false
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required')
        return false
      }
      
      // Check age
      const today = new Date()
      const birth = new Date(formData.dateOfBirth)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      if (age < 18) {
        setError('You must be 18 or older to participate')
        return false
      }
      
      if (!formData.tosAccepted) {
        setError('You must accept the Terms of Service')
        return false
      }
      if (!formData.popiaAccepted) {
        setError('You must accept the POPIA agreement')
        return false
      }
    }
    
    if (step === 2) {
      if (formData.selectedGames.length === 0) {
        setError('Please select at least one game')
        return false
      }
    }
    
    if (step === 3) {
      if (formData.challengeAnswer === null) {
        setError('Please answer the verification question')
        return false
      }
      if (formData.challengeAnswer !== challenge.correctIndex) {
        setError('Incorrect answer. Please try again.')
        return false
      }
    }
    
    return true
  }

  const handleNext = async () => {
    if (!validateStep()) return
    
    if (step < 3) {
      setStep(step + 1)
      setError('')
    } else {
      // Submit form
      setLoading(true)
      try {
        const response = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to complete onboarding')
        }
        
        router.push('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <main className="min-h-screen bg-ggza-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Just a few steps before you can start competing</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {STEPS.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all
                ${step >= s.id 
                  ? 'bg-ggza-gold/20 text-ggza-gold' 
                  : 'bg-white/5 text-gray-500'}
              `}>
                {step > s.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
              )}
            </div>
          ))}
        </div>
        
        {/* Form Card */}
        <Card className="p-8">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                />
              </div>
              
              <Input
                label="Mobile Number"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="+27 XX XXX XXXX"
                hint="Used for prize notifications only"
              />
              
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                hint="You must be 18+ to win cash prizes"
              />
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tosAccepted"
                    checked={formData.tosAccepted}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
                  />
                  <span className="text-sm text-gray-300">
                    I agree to the <a href="/terms" className="text-ggza-gold hover:underline">Terms of Service</a> and quiz rules
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="popiaAccepted"
                    checked={formData.popiaAccepted}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
                  />
                  <span className="text-sm text-gray-300">
                    I consent to my data being processed per POPIA regulations
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="newsletterOptIn"
                    checked={formData.newsletterOptIn}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
                  />
                  <span className="text-sm text-gray-400">
                    Send me quiz reminders and updates via email (optional)
                  </span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="whatsappOptIn"
                    checked={formData.whatsappOptIn}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-ggza-black-lighter text-ggza-gold focus:ring-ggza-gold"
                  />
                  <span className="text-sm text-gray-400">
                    Send me quiz reminders via WhatsApp (optional)
                  </span>
                </label>
              </div>
            </div>
          )}
          
          {/* Step 2: Select Games */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-gray-400 text-center mb-6">
                Select the games you want to compete in. You'll get quiz reminders for these titles.
              </p>
              
              <div className="grid gap-4">
                {GAMES.map((game) => (
                  <button
                    key={game.slug}
                    onClick={() => toggleGame(game.slug)}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${formData.selectedGames.includes(game.slug)
                        ? 'border-ggza-gold bg-ggza-gold/5'
                        : 'border-white/10 hover:border-white/20'}
                    `}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${game.color}20` }}
                    >
                      <Gamepad2 className="w-6 h-6" style={{ color: game.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{game.name}</div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${formData.selectedGames.includes(game.slug)
                        ? 'border-ggza-gold bg-ggza-gold'
                        : 'border-white/20'}
                    `}>
                      {formData.selectedGames.includes(game.slug) && (
                        <Check className="w-4 h-4 text-ggza-black" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: SA Verification */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-ggza-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-ggza-gold" />
                </div>
                <p className="text-gray-400">
                  Answer this question to verify you're a South African gamer
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-ggza-black border border-white/10">
                <p className="text-lg text-white mb-6">{challenge.question}</p>
                
                <div className="space-y-3">
                  {challenge.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, challengeAnswer: index }))
                        setError('')
                      }}
                      className={`
                        w-full p-4 rounded-xl border-2 text-left transition-all
                        ${formData.challengeAnswer === index
                          ? 'border-ggza-gold bg-ggza-gold/10 text-white'
                          : 'border-white/10 text-gray-300 hover:border-white/20'}
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            
            <Button onClick={handleNext} loading={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 3 ? (
                'Complete Setup'
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

