/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: teal — modern, trustworthy e-commerce feel
        primary: {
          50:  '#eef7f6',
          100: '#d5eeec',
          200: '#aeddda',
          300: '#7cc7c3',
          400: '#4aaaa5',
          500: '#2e8f8a',
          600: '#247370',
          700: '#1e5c5a',
          800: '#1a4a48',
          900: '#163d3b',
          950: '#0c2524',
        },
        // Warm amber accent
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Teal-tinted surface grays — used for ALL surfaces (bg, cards, text)
        // Dark mode uses teal-tinted darks instead of cold blue-grays
        surface: {
          50:  '#f8fafa',
          100: '#f0f5f5',
          200: '#ddeaea',
          300: '#bdd4d3',
          400: '#8fb5b3',
          500: '#5f9290',
          600: '#3d706e',
          700: '#2a5250',
          800: '#1c3836',  // dark mode cards
          900: '#122828',  // dark mode nav/sidebar
          950: '#0a1f1e',  // dark mode page bg — deep teal, not navy
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      boxShadow: {
        'soft':   '0 2px 15px -3px rgba(0,0,0,.07), 0 10px 20px -2px rgba(0,0,0,.04)',
        'card':   '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'lifted': '0 10px 40px -10px rgba(46,143,138,.25)',
        'glow':   '0 0 0 3px rgba(46,143,138,.2)',
      },
      animation: {
        'fade-in':    'fadeIn .35s ease',
        'slide-up':   'slideUp .4s ease',
        'slide-in':   'slideIn .3s ease',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                                '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn:   { '0%': { opacity: '0', transform: 'translateX(-10px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.6' } },
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}