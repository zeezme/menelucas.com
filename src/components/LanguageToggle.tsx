import { type Translator } from '../internationalization'
import type { Locale } from '../schema/resume'

interface LanguageToggleProps {
  locale: Locale
  /** Endereço da mesma página no idioma pedido. */
  hrefForLocale: (locale: Locale) => string
  translate: Translator
}

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'pt', label: 'PT' },
  { locale: 'en', label: 'EN' },
]

/** Botão PT | EN. O script inline guarda a escolha para as próximas visitas. */
export const LanguageToggle = ({ locale, hrefForLocale, translate }: LanguageToggleProps) => (
  <nav aria-label={translate('languageNav')}>
    <ul className="flex overflow-hidden rounded-btn border border-hairline bg-surface-1">
      {OPTIONS.map((option) => {
        const isCurrent = option.locale === locale
        return (
          <li key={option.locale}>
            <a
              href={hrefForLocale(option.locale)}
              hrefLang={option.locale}
              lang={option.locale}
              data-lang={option.locale}
              aria-current={isCurrent ? 'page' : undefined}
              className={`inline-flex min-h-[42px] min-w-[48px] items-center justify-center px-3 text-sm font-medium transition-colors ${
                isCurrent ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
              }`}
            >
              {option.label}
              <span className="sr-only"> — {translate(option.locale === 'pt' ? 'langPt' : 'langEn')}</span>
            </a>
          </li>
        )
      })}
    </ul>
  </nav>
)
