import type { Config } from 'tailwindcss'

/** Tokens do design system do Linear (DESIGN.md), com o acento azul do banner (#3b82f6). */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Cores vêm de variáveis CSS (src/styles/main.css) para alternar entre tema escuro e claro.
      colors: {
        canvas: 'var(--c-canvas)',
        surface: { 1: 'var(--c-surface-1)', 2: 'var(--c-surface-2)', 3: 'var(--c-surface-3)', 4: 'var(--c-surface-4)' },
        hairline: { DEFAULT: 'var(--c-hairline)', strong: 'var(--c-hairline-strong)' },
        ink: { DEFAULT: 'var(--c-ink)', muted: 'var(--c-ink-muted)', subtle: 'var(--c-ink-subtle)' },
        accent: { DEFAULT: 'var(--c-accent)', solid: '#2563eb', hover: '#1d4ed8' },
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
