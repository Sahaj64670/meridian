/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: deep evergreen + warm parchment — calm, premium, trustworthy.
        brand: {
          50: '#f0f7f4',
          100: '#d9ece4',
          200: '#b5d9cb',
          300: '#88bfa9',
          400: '#58a186',
          500: '#3a866c',
          600: '#2a6b56',
          700: '#235647',
          800: '#1f453a',
          900: '#1b3a31',
          950: '#0c211b',
        },
        gold: {
          300: '#f5d78a',
          400: '#eec25f',
          500: '#d9a53c',
          600: '#b8842c',
        },
        ink: {
          DEFAULT: '#131a17',
          soft: '#3f4a45',
          faint: '#75817b',
        },
        paper: '#faf8f3',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 20 / 0.04), 0 8px 24px -12px rgb(16 24 20 / 0.12)',
        lift: '0 12px 40px -12px rgb(16 24 20 / 0.25)',
      },
      keyframes: {
        rise: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
