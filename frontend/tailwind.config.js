/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        body: ['"Public Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#c9a84c', // Matching booth iq primary gold
          dark: '#b08d3a',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: '#e8761a', // Saffron
        navy: '#080d1a',
        navy2: '#0d1528',
        navy3: '#111e35',
        gold: '#c9a84c',
        gold2: '#e8c56a',
        cream: '#f0ece3',
        saffron: '#e8761a',
        'background-light': '#fafaf8',
        'background-dark': '#0a0a0f',
        'surface-light': '#ffffff',
        'surface-dark': '#1a2e22',
        'accent-saffron': '#FF9933',
        'charcoal-dark': '#0a0a0f',
        'charcoal-light': '#121218',
        'accent-red': '#ef4444',
        'accent-green': '#10b981',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        shimmer: {
          to: { backgroundPosition: '200% center' }
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'fade-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        ticker: 'ticker 40s linear infinite',
        shimmer: 'shimmer 3s linear infinite',
        pop: 'pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'fade-up 0.5s ease-out forwards'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};