module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        void:         '#060608',
        abyss:        '#0e0d10',
        iron:         '#1a181e',
        'iron-light': '#252229',
        rust:         '#2e1a1a',
        blood:        '#7a0000',
        crimson:      '#c0392b',
        ember:        '#e74c3c',
        scar:         '#ff6b4a',
        bone:         '#f0e8d5',  // ← antes #d4c9b0, ahora más blanco
        ash:          '#b0a8bc',  // ← antes #8a8090, ahora más claro
        ghost:        '#6e6880',  // ← antes #4a4455, ahora más claro
        gold:         '#e8c46a',  // ← antes #c9a84c, ahora más brillante
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        title:   ['Cinzel', 'serif'],
        body:    ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}