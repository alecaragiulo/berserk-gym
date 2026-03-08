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
        void:       '#060608',
        abyss:      '#0e0d10',
        iron:       '#1a181e',
        'iron-light': '#252229',
        rust:       '#2e1a1a',
        blood:      '#7a0000',
        crimson:    '#c0392b',
        ember:      '#e74c3c',
        scar:       '#ff6b4a',
        bone:       '#d4c9b0',
        ash:        '#8a8090',
        ghost:      '#4a4455',
        gold:       '#c9a84c',
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        title:   ['Cinzel', 'serif'],
        body:    ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'flicker': 'flicker 8s infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%':  { opacity: '1' },
          '93%':  { opacity: '0.85' },
          '94%':  { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
