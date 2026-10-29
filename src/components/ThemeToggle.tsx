import type { Translator } from '../internationalization'
import { Tooltip } from './Tooltip'
import { MoonIcon, SunIcon } from './icons'

interface ThemeToggleProps {
  translate: Translator
}

/** Alterna entre tema claro e escuro; `aria-pressed` indica se o tema escuro está ativo (o script inline o mantém em dia). Sem classe de `display`: ele só aparece com JavaScript, via `[data-theme-toggle]` em `main.css`. */
export const ThemeToggle = ({ translate }: ThemeToggleProps) => (
  <Tooltip label={translate('themeToggle')} align="end">
    <button
      type="button"
      data-theme-toggle
      aria-label={translate('themeToggle')}
      aria-pressed="false"
      className="min-h-touch min-w-touch items-center justify-center rounded-btn border border-hairline bg-surface-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  </Tooltip>
)
