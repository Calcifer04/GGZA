'use client'

// Sound effects for the quiz using Web Audio API
// This avoids the need for audio files

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled = true

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported')
        return null
      }
    }
    
    // Resume context if suspended (required for autoplay policies)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    
    return this.audioContext
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }

  // Countdown tick sound (3, 2, 1)
  playCountdownTick(number: number) {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Higher pitch for lower numbers (builds tension)
    const baseFreq = 440 + (4 - number) * 100
    oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  // Quiz start sound (GO!)
  playStart() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    // Play a rising chord
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime)
      oscillator.type = 'sine'

      const startTime = ctx.currentTime + i * 0.05
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.4)
    })
  }

  // Correct answer sound
  playCorrect() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    // Happy ascending two-note chime
    const notes = [523.25, 783.99] // C5 to G5
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      const startTime = ctx.currentTime + i * 0.1
      oscillator.frequency.setValueAtTime(freq, startTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.25, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  }

  // Wrong answer sound
  playWrong() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    // Descending buzz
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3)
    oscillator.type = 'sawtooth'

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  // Timer tick (for low time warning)
  playTimerTick() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  }

  // Time's up sound
  playTimeUp() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    // Descending warning tone
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5)
    oscillator.type = 'triangle'

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  }

  // Click/select sound
  playClick() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }
}

// Singleton instance
export const sounds = new SoundManager()
