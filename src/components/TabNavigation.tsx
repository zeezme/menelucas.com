import { pagePath, type PageId, type Translator } from '../internationalization'
import { showcaseProjects, type Locale, type Resume } from '../schema/resume'

interface TabNavigationProps {
  resume: Resume
  currentPage: PageId
  locale: Locale
  base: string
  translate: Translator
}

/**
 * Abas "Currículo | Projetos" no topo. Só existem se algum projeto tiver partes do sistema:
 * tirar o projeto de `resume.json` remove a aba e a página.
 */
export const TabNavigation = ({ resume, currentPage, locale, base, translate }: TabNavigationProps) => {
  if (showcaseProjects(resume).length === 0) return null
  const tabs: { page: PageId; label: string }[] = [
    { page: 'resume', label: translate('tabResume') },
    { page: 'projects', label: translate('tabProjects') },
  ]
  return (
    <nav aria-label={translate('tabsNav')} className="print:hidden">
      <ul className="inline-flex overflow-hidden rounded-btn border border-hairline bg-surface-1">
        {tabs.map((tab) => {
          const isCurrent = tab.page === currentPage
          return (
            <li key={tab.page}>
              <a
                href={pagePath(tab.page, locale, base)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex min-h-[42px] items-center justify-center px-4 text-sm font-medium transition-colors ${
                  isCurrent ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                {tab.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
