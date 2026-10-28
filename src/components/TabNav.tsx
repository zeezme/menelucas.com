import type { Locale, Resume } from '../schema/resume'
import { showcaseProjects } from '../schema/resume'
import { pagePath, type PageId, type T } from '../i18n'

interface Props {
  resume: Resume
  current: PageId
  locale: Locale
  base: string
  t: T
}

/**
 * Abas "Currículo | Projetos" no topo. Só aparecem se houver projeto com galeria:
 * tirar o projeto do resume.json remove a aba e a página.
 */
export function TabNav({ resume, current, locale, base, t }: Props) {
  if (showcaseProjects(resume).length === 0) return null
  const tabs: { page: PageId; label: string }[] = [
    { page: 'resume', label: t('tabResume') },
    { page: 'projects', label: t('tabProjects') },
  ]
  return (
    <nav aria-label={t('tabsNav')} className="print:hidden">
      <ul className="inline-flex overflow-hidden rounded-btn border border-hairline bg-surface-1">
        {tabs.map((tab) => (
          <li key={tab.page}>
            <a
              href={pagePath(tab.page, locale, base)}
              aria-current={tab.page === current ? 'page' : undefined}
              className={`inline-flex min-h-[42px] items-center justify-center px-4 text-sm font-medium transition-colors ${
                tab.page === current ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
              }`}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
