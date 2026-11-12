/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        madani: {
          yellow: '#FFC800',
          'yellow-hover': '#FFD324',
          'yellow-lip': '#D99B00',
          'yellow-text': '#4B4B4B',
          'yellow-tint': '#FFF5D6',
          emerald: '#10B981',
          'emerald-hover': '#34D399',
          'emerald-lip': '#059669',
          'emerald-tint': '#D1FAE5',
          sky: '#0EA5E9',
          'sky-hover': '#38BDF8',
          'sky-lip': '#0284C7',
          'sky-tint': '#E0F2FE',
          purple: '#8B5CF6',
          'purple-hover': '#A78BFA',
          'purple-lip': '#6D28D9',
          'purple-tint': '#EDE9FE',
          ruby: '#EF4444',
          'ruby-hover': '#F87171',
          'ruby-lip': '#B91C1C',
          'ruby-tint': '#FEE2E2',
          orange: '#F97316',
          'orange-hover': '#FB923C',
          'orange-lip': '#C2410C',
          'orange-tint': '#FFEDD5',
          snow: '#FFFFFF',
          polar: '#F7F7F7',
          swan: '#E5E5E5',
          koala: '#AFAFAF',
          hare: '#777777',
          wolf: '#4B4B4B',
          eel: '#4B4B4B',
          black: '#1E293B'
        }
      },
      fontFamily: {
        duo: ['Fredoka', 'Nunito', 'sans-serif'],
        'duo-display': ['Fredoka', 'Nunito', 'sans-serif'],
        nunito: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Space Mono', 'monospace']
      },
      borderRadius: {
        'card': '28px',
        'banner': '28px',
        'inner-md': '12px',
        'inner-sm': '8px',
        'inner-xs': '6px',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      animation: {
        'pop-in': 'popIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'bounce-subtle': 'bounceSubtle 2.8s ease-in-out infinite',
        'shake': 'gentleShake 0.45s ease-in-out',
        'star': 'floatPulse 2.2s ease-in-out infinite'
      },
      keyframes: {
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.88) translateY(12px)' },
          '70%': { transform: 'scale(1.02) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        gentleShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' }
        },
        floatPulse: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.05)' }
        }
      }
    },
  },
  plugins: [],
}
