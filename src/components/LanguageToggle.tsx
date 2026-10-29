import { type Translator } from '../internationalization'
import type { Locale } from '../schema/resume'
import { Tooltip } from './Tooltip'

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
    <ul className="flex rounded-btn border border-hairline bg-surface-1">
      {OPTIONS.map((option, optionIndex) => {
        const isCurrent = option.locale === locale
        const cornerClass = optionIndex === 0 ? 'rounded-l-btn' : 'rounded-r-btn'
        return (
          <li key={option.locale}>
            <Tooltip label={translate(option.locale === 'pt' ? 'langPt' : 'langEn')}>
              <a
                href={hrefForLocale(option.locale)}
                hrefLang={option.locale}
                lang={option.locale}
                data-lang={option.locale}
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex min-h-[42px] min-w-[48px] items-center justify-center px-3 text-sm font-medium transition-colors ${cornerClass} ${
                  isCurrent ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                {option.label}
                <span className="sr-only"> — {translate(option.locale === 'pt' ? 'langPt' : 'langEn')}</span>
              </a>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  </nav>
)
