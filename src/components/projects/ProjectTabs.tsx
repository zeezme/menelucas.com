import type { Translator } from '../../internationalization'
import { projectSlug, projectTitle, type Locale, type Project } from '../../schema/resume'

interface ProjectTabsProps {
  projects: Project[]
  locale: Locale
  translate: Translator
}

/** Abas para escolher o projeto. O script inline mostra um projeto por vez; sem JavaScript, todos ficam em sequência. */
export const ProjectTabs = ({ projects, locale, translate }: ProjectTabsProps) => (
  <nav aria-label={translate('projectsNav')} data-projects-nav className="-mb-6 print:hidden">
    <ul className="flex flex-wrap items-end gap-1 border-b border-hairline">
      {projects.map((project) => (
        <li key={projectSlug(project)}>
          <a
            href={`#${projectSlug(project)}-overview`}
            data-project-link={projectSlug(project)}
            className="relative inline-flex min-h-touch items-center rounded-t-xl border border-b-0 border-transparent px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink aria-[current=true]:-mb-px aria-[current=true]:border-hairline aria-[current=true]:bg-surface-1 aria-[current=true]:pb-[calc(0.5rem+1px)] aria-[current=true]:text-ink"
          >
            {projectTitle(project, locale)}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)
