import type { ReactNode } from 'react'
import { pagePath, type PageId, type Translator } from '../internationalization'
import type { Locale, Resume } from '../schema/resume'
import { LanguageToggle } from './LanguageToggle'
import { GitHubIcon } from './icons'
import { SkipLink } from './SkipLink'
import { TabNavigation } from './TabNavigation'
import { ThemeToggle } from './ThemeToggle'

interface PageShellProps {
  resume: Resume
  currentPage: PageId
  locale: Locale
  base: string
  translate: Translator
  children: ReactNode
}

/**
 * Estrutura comum a todas as páginas: link de pular para o conteúdo, a mesma largura e a mesma barra superior
 * (abas à esquerda, idioma e tema à direita). Assim os controles não mudam de lugar ao trocar de página.
 */
export const PageShell = ({ resume, currentPage, locale, base, translate, children }: PageShellProps) => (
  <>
    <SkipLink translate={translate} />
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 print:hidden">
        <TabNavigation resume={resume} currentPage={currentPage} locale={locale} base={base} translate={translate} />
        <div className="flex items-center gap-3">
          <LanguageToggle
            locale={locale}
            hrefForLocale={(targetLocale) => pagePath(currentPage, targetLocale, base)}
            translate={translate}
          />
          <ThemeToggle translate={translate} />
        </div>
      </header>
      {children}
      {resume.meta.repository ? (
        <footer className="border-t border-hairline pt-6 print:hidden">
          <a
            href={resume.meta.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-touch items-center gap-2 text-sm text-ink-muted underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
          >
            <GitHubIcon />
            {translate('sourceCode')}
            <span className="sr-only"> ({translate('opensInNewTab')})</span>
          </a>
        </footer>
      ) : null}
    </div>
  </>
)
