import type { Translator } from '../internationalization'
import { MoonIcon, SunIcon } from './icons'

interface ThemeToggleProps {
  translate: Translator
}

/** Alterna entre tema claro e escuro. Sem classe de `display`: ele só aparece com JavaScript, via `[data-theme-toggle]` em `main.css`. */
export const ThemeToggle = ({ translate }: ThemeToggleProps) => (
  <button
    type="button"
    data-theme-toggle
    aria-label={translate('themeToggle')}
    className="min-h-touch min-w-touch items-center justify-center rounded-btn border border-hairline bg-surface-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
  >
    <SunIcon />
    <MoonIcon />
  </button>
)
