import { pick, type Translator } from '../../internationalization'
import { projectTitle, type Locale, type Project } from '../../schema/resume'
import { BulletList } from '../BulletList'
import { Heading, type HeadingLevel } from '../Heading'
import { FlowDiagram } from './FlowDiagram'
import { TopicList } from './TopicList'

interface ProjectOverviewProps {
  project: Project
  /** Id do painel, usado como âncora da barra lateral. */
  id: string
  /** Nível do título do painel e dos títulos das seções dentro dele. */
  panelLevel: HeadingLevel
  sectionLevel: HeadingLevel
  locale: Locale
  translate: Translator
}

const HEADING_CLASS = 'text-xl font-semibold leading-snug tracking-title'

/** Painel "Visão geral" do projeto: descrição, destaques, diagramas, seções temáticas e nota. */
export const ProjectOverview = ({ project, id, panelLevel, sectionLevel, locale, translate }: ProjectOverviewProps) => (
  <section id={id} aria-label={`${translate('overview')}: ${projectTitle(project, locale)}`} className="flex flex-col gap-8 scroll-mt-6">
    <div className="flex flex-col gap-4">
      <Heading level={panelLevel} tabIndex={-1} className={`${HEADING_CLASS} outline-none`}>
        {translate('overview')}
      </Heading>
      <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(project.description, locale)}</p>
      <BulletList items={project.highlights} locale={locale} />
    </div>
    {(project.diagrams ?? []).map((diagram) => (
      <FlowDiagram key={diagram.title.en} diagram={diagram} locale={locale} plannedLabel={translate('plannedStep')} />
    ))}
    {(project.detailSections ?? []).map((section) => (
      <div key={section.title.en} className="flex flex-col gap-3">
        <Heading level={sectionLevel} className="text-lg font-semibold leading-snug tracking-title">
          {pick(section.title, locale)}
        </Heading>
        <TopicList topics={section.topics} locale={locale} />
      </div>
    ))}
    {project.notice ? (
      <aside aria-label={translate('noteLabel')} className="rounded-xl border border-hairline-strong bg-surface-2 p-5">
        <p className="text-pretty text-sm leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">{translate('noteLabel')}. </span>
          {pick(project.notice, locale)}
        </p>
      </aside>
    ) : null}
  </section>
)
