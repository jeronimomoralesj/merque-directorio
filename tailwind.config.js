/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff9900',
          50: '#fff7ea',
          100: '#ffedcc',
          200: '#ffd894',
          300: '#ffbe5c',
          400: '#ffa72e',
          500: '#ff9900',
          600: '#db7f00',
          700: '#b66700',
          800: '#8f5100',
          900: '#743f00',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          900: '#0a0a0a',
          800: '#161616',
          700: '#242424',
          600: '#3a3a3a',
          500: '#5c5c5c',
          400: '#8a8a8a',
          300: '#b5b5b5',
          200: '#dcdcdc',
          100: '#f2f2f2',
          50: '#fafafa',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 8px 30px -8px rgba(255,153,0,0.45)',
      },
      keyframes: {
        'spin-decel': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(var(--final-rotation))' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.85) translateY(10px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
