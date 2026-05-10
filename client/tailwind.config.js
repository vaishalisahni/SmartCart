/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep teal-indigo: modern e-commerce feel, trustworthy, premium
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
        // Neutral warm grays
        surface: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
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
        'fade-in':   'fadeIn .35s ease',
        'slide-up':  'slideUp .4s ease',
        'slide-in':  'slideIn .3s ease',
        'pulse-soft':'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                           '100%': { opacity: '1' } },
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