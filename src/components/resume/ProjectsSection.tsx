import { pagePath, pick, type Translator } from '../../internationalization'
import { projectSlug, projectTitle, showcaseProjects, type Locale, type Project, type Resume } from '../../schema/resume'
import { BulletList } from '../BulletList'
import { DateRange } from '../DateRange'
import { Section } from '../Section'

interface ProjectsSectionProps {
  resume: Resume
  locale: Locale
  base: string
  translate: Translator
}

interface ProjectCardProps {
  project: Project
  /** Se é o primeiro projeto da página Projetos; os demais levam direto à própria seção. */
  isFirstShowcase: boolean
  locale: Locale
  base: string
  translate: Translator
}

const ProjectCard = ({ project, isFirstShowcase, locale, base, translate }: ProjectCardProps) => {
  const hasScreens = project.areas?.some((area) => area.gallery) ?? false
  const detailsAnchor = isFirstShowcase ? '' : `#${projectSlug(project)}-overview`
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h3 translate={project.title ? undefined : 'no'} className="text-lg font-semibold leading-snug tracking-title">
            {projectTitle(project, locale)}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{pick(project.roles, locale)}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              <DateRange
                startDate={project.startDate}
                endDate={project.endDate}
                locale={locale}
                presentLabel={translate('present')}
              />
            </span>
          </p>
        </div>
        {(project.areas?.length ?? 0) > 0 ? (
          <a
            href={`${pagePath('projects', locale, base)}${detailsAnchor}`}
            className="inline-flex min-h-touch shrink-0 items-center gap-1 text-sm font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:decoration-accent"
          >
            {translate(hasScreens ? 'projectDetails' : 'projectDetailsEngineering')}
            <span className="sr-only">: {projectTitle(project, locale)}</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </header>
      <p className="max-w-[80ch] text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">
        {pick(project.cardText ?? project.description, locale)}
      </p>
      {project.cardText ? null : <BulletList items={project.highlights} locale={locale} className="max-w-[80ch]" />}
    </article>
  )
}

/** Seção opcional: some quando `projects` está ausente ou vazio, bastando tirar o item do JSON. */
export const ProjectsSection = ({ resume, locale, base, translate }: ProjectsSectionProps) => {
  const projects = resume.projects ?? []
  if (projects.length === 0) return null
  const firstShowcase = showcaseProjects(resume)[0]
  return (
    <Section id="projects" title={translate('projects')}>
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.name}
            project={project}
            isFirstShowcase={project === firstShowcase}
            locale={locale}
            base={base}
            translate={translate}
          />
        ))}
      </div>
    </Section>
  )
}
