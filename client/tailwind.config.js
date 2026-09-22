/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: marketplace blue — familiar, trustworthy, Flipkart/Amazon territory.
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebdff',
          400: '#599aff',
          500: '#327ef7',
          600: '#2874f0',
          700: '#1f5fd0',
          800: '#1e4ea8',
          900: '#1d4286',
          950: '#14294f',
        },
        // CTA orange — add-to-cart / buy-now energy (kept the `gold` key so
        // existing class names keep working).
        gold: {
          300: '#ffc24d',
          400: '#ff9f00',
          500: '#fb641b',
          600: '#e2540e',
        },
        ink: {
          DEFAULT: '#212121',
          soft: '#4a5560',
          faint: '#878787',
        },
        paper: '#f1f3f6',
      },
      fontFamily: {
        display: ['"Sora"', '"Inter"', 'system-ui', 'sans-serif'],
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
