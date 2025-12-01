import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ggza': {
          gold: '#FFD700',
          'gold-dark': '#B8960F',
          black: '#0A0A0B',
          'black-light': '#141416',
          'black-lighter': '#1E1E22',
          green: '#007A33',
          red: '#DE3831',
          blue: '#002395',
          white: '#FAFAFA',
        },
        'game': {
          cs2: '#DE9B35',
          valorant: '#FD4556',
          fifa: '#326295',
          fortnite: '#9D4DFF',
          apex: '#DA292A',
        }
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A0A0B 0%, #1E1E22 50%, #0A0A0B 100%)',
        'gold-gradient': 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(30,30,34,0.8) 0%, rgba(10,10,11,0.95) 100%)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'countdown': 'countdown 5s linear',
        'progress': 'progress 5s linear',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'countdown': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        'progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'gold-lg': '0 0 40px rgba(255, 215, 0, 0.5)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
}
export default config

