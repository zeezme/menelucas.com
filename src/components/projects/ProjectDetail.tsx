import { pick, projectPath, type Translator } from '../../internationalization'
import { projectSlug, projectTitle, toSlug, type Locale, type Project } from '../../schema/resume'
import { DateRange } from '../DateRange'
import { Heading, type HeadingLevel } from '../Heading'
import { AreaPanel } from './AreaPanel'
import { ProjectOverview } from './ProjectOverview'

interface ProjectDetailProps {
  project: Project
  /** Se há mais de um projeto, as abas ficam acima e o filete do topo sai. */
  hasTabs: boolean
  /** Na página própria do projeto o título é o h1 e as partes são h2; na página com todos os projetos, h2 e h3. */
  standalone?: boolean
  locale: Locale
  base: string
  translate: Translator
}

const PAGER_DIRECTIONS = ['prev', 'next'] as const

/**
 * Projeto completo: cabeçalho, aviso, barra lateral com as partes do sistema e os painéis.
 * Os botões Anterior e Próxima ficam no fim de cada painel e só aparecem no celular, onde a barra lateral fica no topo.
 */
export const ProjectDetail = ({ project, hasTabs, standalone = false, locale, base, translate }: ProjectDetailProps) => {
  const levels: { project: HeadingLevel; panel: HeadingLevel; section: HeadingLevel } = standalone
    ? { project: 1, panel: 2, section: 3 }
    : { project: 2, panel: 3, section: 4 }
  const slug = projectSlug(project)
  const title = projectTitle(project, locale)
  const panels = [
    { id: `${slug}-overview`, label: translate('overview') },
    ...(project.areas ?? []).map((area) => ({ id: `${slug}-${toSlug(area.title.en)}`, label: pick(area.title, locale) })),
  ]
  return (
    <article
      aria-labelledby={`${slug}-title`}
      data-project={slug}
      className={`flex flex-col gap-8 ${hasTabs ? 'pt-2' : 'border-t border-hairline pt-8'}`}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <Heading
            level={levels.project}
            id={`${slug}-title`}
            translate={project.title ? undefined : 'no'}
            className="text-2xl font-semibold leading-tight tracking-title sm:text-[1.75rem]"
          >
            {title}
          </Heading>
          <p className="mt-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{pick(project.roles, locale)}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              <DateRange startDate={project.startDate} endDate={project.endDate} locale={locale} presentLabel={translate('present')} />
            </span>
          </p>
        </div>
        {standalone ? null : (
          <a
            href={projectPath(slug, locale, base)}
            className="inline-flex min-h-touch shrink-0 items-center gap-1 text-sm font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:decoration-accent"
          >
            {translate('openProjectPage')}
            <span className="sr-only">: {title}</span>
            <span aria-hidden="true">→</span>
          </a>
        )}
      </header>

      <div className="grid gap-8 md:grid-cols-[13.5rem_minmax(0,1fr)] md:items-start">
        <nav
          aria-label={`${translate('partsNav')}: ${title}`}
          data-areas-nav
          className="rounded-xl border border-hairline bg-surface-1 p-2 md:sticky md:top-6"
        >
          <ul className="flex flex-wrap gap-1 md:flex-col">
            {panels.map((panel) => (
              <li key={panel.id} className="md:w-full">
                <a
                  href={`#${panel.id}`}
                  className="inline-flex min-h-touch items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink aria-[current=true]:bg-surface-3 aria-[current=true]:text-ink md:w-full md:min-h-[42px]"
                >
                  {panel.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <ProjectOverview
            project={project}
            id={panels[0]?.id ?? `${slug}-overview`}
            panelLevel={levels.panel}
            sectionLevel={levels.section}
            locale={locale}
            translate={translate}
          />
          {(project.areas ?? []).map((area, areaIndex) => (
            <AreaPanel key={area.title.en} area={area} id={panels[areaIndex + 1]?.id ?? ''} project={project} panelLevel={levels.panel} locale={locale} base={base} translate={translate} />
          ))}
          <nav
            aria-label={`${translate('pagerNav')}: ${title}`}
            data-areas-pager
            hidden
            className="flex items-stretch justify-between gap-3 border-t border-hairline pt-6 md:hidden print:hidden"
          >
            {PAGER_DIRECTIONS.map((direction) => (
              <a
                key={direction}
                href={`#${(direction === 'prev' ? panels[0] : panels[1])?.id ?? panels[0]?.id}`}
                data-pager={direction}
                className={`flex min-h-touch min-w-0 max-w-[48%] flex-col justify-center gap-0.5 rounded-xl border border-hairline bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2 ${direction === 'next' ? 'ml-auto text-right' : ''}`}
              >
                <span className="text-xs text-ink-subtle">{translate(direction === 'prev' ? 'prevPart' : 'nextPart')}</span>
                <span data-pager-name className="text-sm font-medium text-ink"></span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </article>
  )
}
