import { pick, projectPath, type Translator } from '../../internationalization'
import { projectSlug, projectTitle, type Locale, type Project } from '../../schema/resume'
import { DateRange } from '../DateRange'

interface ProjectMenuProps {
  projects: Project[]
  locale: Locale
  /** Prefixo de publicação, com barras nas pontas. */
  base: string
  translate: Translator
}

/**
 * Menu de projetos: cada item é um link para a página própria do projeto. Sem caixas, só filetes entre os itens.
 * O link é o título (o nome acessível é exatamente o texto visível) e se estende por cima da linha inteira, então
 * clicar em qualquer ponto do item abre o projeto; o papel, o período e o resumo ficam fora do link.
 */
export const ProjectMenu = ({ projects, locale, base, translate }: ProjectMenuProps) => (
  <nav aria-label={translate('projectsMenu')}>
    <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
      {projects.map((project) => (
        <li key={projectSlug(project)} className="group relative flex items-start justify-between gap-6 py-6 transition-colors hover:bg-surface-2 sm:-mx-3 sm:rounded-lg sm:px-3">
          <div className="flex min-w-0 flex-col gap-2">
            <a
              href={projectPath(projectSlug(project), locale, base)}
              data-project-slug={projectSlug(project)}
              translate={project.title ? undefined : 'no'}
              className="text-xl font-semibold leading-snug tracking-title text-ink after:absolute after:inset-0 after:content-['']"
            >
              {projectTitle(project, locale)}
            </a>
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">{pick(project.roles, locale)}</span>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums">
                <DateRange startDate={project.startDate} endDate={project.endDate} locale={locale} presentLabel={translate('present')} />
              </span>
            </p>
            <p className="max-w-[75ch] text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">
              {pick(project.cardText ?? project.description, locale)}
            </p>
          </div>
          <span aria-hidden="true" className="mt-1 shrink-0 text-xl text-ink-subtle transition-transform group-hover:translate-x-1 group-hover:text-ink">
            →
          </span>
        </li>
      ))}
    </ul>
  </nav>
)
