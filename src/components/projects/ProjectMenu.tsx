import type { Translator } from '../../internationalization'
import { projectSlug, projectTitle, type Locale, type Project } from '../../schema/resume'
import { ChevronDownIcon } from '../icons'

interface ProjectMenuProps {
  projects: Project[]
  locale: Locale
  translate: Translator
}

/**
 * Menu para escolher o projeto. Começa escondido: o script inline o mostra e passa a exibir um projeto por vez.
 * Sem JavaScript o menu some e todos os projetos ficam em sequência.
 */
export const ProjectMenu = ({ projects, locale, translate }: ProjectMenuProps) => (
  <div data-projects-menu hidden className="flex flex-col gap-2 print:hidden">
    <label htmlFor="project-select" className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">
      {translate('projectSelectLabel')}
    </label>
    <div className="relative w-full sm:w-80">
      <select
        id="project-select"
        data-project-select
        className="min-h-touch w-full appearance-none rounded-btn border border-hairline bg-surface-1 py-2 pl-4 pr-11 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
      >
        {projects.map((project) => (
          <option key={projectSlug(project)} value={projectSlug(project)}>
            {projectTitle(project, locale)}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle">
        <ChevronDownIcon />
      </span>
    </div>
  </div>
)
