/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cafe-dark': '#1a1614',
        'cafe-brown': '#2d2420',
        'cafe-tan': '#c4a77d',
        'cafe-cream': '#f5f0e6',
        'cafe-gold': '#d4a855',
        'cafe-sepia': '#704214',
        'cafe-paper': '#ebe5d5',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Source Serif Pro', 'Georgia', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
