import type { Config } from 'tailwindcss'

/** Tokens do design system do Linear (DESIGN.md), com o acento azul do banner (#3b82f6). */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#010102',
        surface: { 1: '#0f1011', 2: '#141516', 3: '#18191a', 4: '#191a1b' },
        hairline: { DEFAULT: '#23252a', strong: '#34343a' },
        ink: { DEFAULT: '#f7f8f8', muted: '#d0d6e0', subtle: '#b4bac4' },
        accent: { DEFAULT: '#3b82f6', solid: '#2563eb', hover: '#1d4ed8' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      letterSpacing: { display: '-0.03em', title: '-0.02em' },
      borderRadius: { btn: '8px' },
      maxWidth: { prose: '720px' },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
} satisfies Config
