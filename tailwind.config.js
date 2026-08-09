/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        green: {
          DEFAULT: '#2D9D78',
          50:  '#EBF7F2',
          100: '#D2EDE0',
          200: '#A8DCC2',
          300: '#7ACA9F',
          400: '#4FB881',
          500: '#2D9D78',
          600: '#228063',
          700: '#1B6350',
          800: '#154A3C',
          900: '#0E3229',
          950: '#08201A',
        },
        // Orange accent
        brand: {
          DEFAULT: '#FF7401',
          50:  '#FFF3E8',
          100: '#FFE4C4',
          200: '#FFC880',
          300: '#FFAD3D',
          400: '#FF9218',
          500: '#FF7401',
          600: '#E56500',
          700: '#BF5300',
          800: '#993F00',
          900: '#6B2C00',
          950: '#3D1800',
        },
        // Dark neutrals (zinc-based, Apple-ish)
        ink: {
          DEFAULT: '#1C1C1E',
          950: '#0A0A0A',
          900: '#111111',
          800: '#1C1C1E',
          700: '#2C2C2E',
          600: '#3A3A3C',
          500: '#636366',
          400: '#8E8E93',
          300: '#AEAEB2',
          200: '#C7C7CC',
          100: '#D1D1D6',
          50:  '#E5E5EA',
          25:  '#F2F2F7',
        },
        // For shadcn CSS variables
        border:       'hsl(var(--border))',
        input:        'hsl(var(--input))',
        ring:         'hsl(var(--ring))',
        background:   'hsl(var(--background))',
        foreground:   'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'system-ui', 'sans-serif'],
        body:    ['Inter',  'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft:         '0 2px 20px -2px rgba(0,0,0,0.06)',
        'soft-md':    '0 4px 30px -4px rgba(0,0,0,0.10)',
        'soft-lg':    '0 8px 40px -4px rgba(0,0,0,0.12)',
        'soft-xl':    '0 16px 60px -8px rgba(0,0,0,0.16)',
        'brand-glow': '0 0 40px -6px rgba(45,157,120,0.40)',
        'brand-sm':   '0 0 20px -4px rgba(45,157,120,0.30)',
        'card':       '0 1px 8px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)',
        'card-dark':  '0 1px 8px rgba(0,0,0,0.30), 0 4px 20px rgba(0,0,0,0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(45,157,120,0.5)' },
          '70%':  { transform: 'scale(1)',    boxShadow: '0 0 0 12px rgba(45,157,120,0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0  rgba(45,157,120,0)' },
        },
        'chat-in': {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200%  0' },
        },
      },
      animation: {
        'fade-up':        'fade-up 0.65s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'slide-in-left':  'slide-in-left 0.6s ease-out forwards',
        'scale-in':       'scale-in 0.55s ease-out forwards',
        'float':          'float 5s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite',
        'chat-in':        'chat-in 0.3s ease-out forwards',
        'shimmer':        'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
