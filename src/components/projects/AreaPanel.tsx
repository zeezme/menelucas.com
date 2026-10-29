import { pick, type Translator } from '../../internationalization'
import type { Area, Locale, Project } from '../../schema/resume'
import { BulletList } from '../BulletList'
import { CodeBlock } from './CodeBlock'
import { FlowDiagram } from './FlowDiagram'
import { ScreenshotFigure } from './ScreenshotFigure'
import { TopicList } from './TopicList'

interface AreaPanelProps {
  area: Area
  /** Id do painel, usado como âncora da barra lateral. */
  id: string
  project: Project
  locale: Locale
  base: string
  translate: Translator
}

/** Painel de uma parte do sistema: explicação, diagramas, código e capturas de tela. */
export const AreaPanel = ({ area, id, project, locale, base, translate }: AreaPanelProps) => (
  <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 scroll-mt-6">
    <div className="flex flex-col gap-4">
      <h3 id={`${id}-title`} className="text-xl font-semibold leading-snug tracking-title">
        {pick(area.title, locale)}
      </h3>
      {area.summary ? (
        <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(area.summary, locale)}</p>
      ) : null}
      {area.points ? <BulletList items={area.points} locale={locale} /> : null}
    </div>
    {area.topics ? <TopicList topics={area.topics} locale={locale} /> : null}
    {(area.diagrams ?? []).map((diagram) => (
      <FlowDiagram key={diagram.title.en} diagram={diagram} locale={locale} plannedLabel={translate('plannedStep')} />
    ))}
    {(area.snippets ?? []).map((snippet) => (
      <CodeBlock key={snippet.code} snippet={snippet} locale={locale} />
    ))}
    {area.gallery && project.galleryNote ? (
      <p className="text-sm text-ink-subtle">{pick(project.galleryNote, locale)}</p>
    ) : null}
    {(area.gallery ?? []).map((item) => (
      <ScreenshotFigure key={item.src} item={item} locale={locale} base={base} />
    ))}
  </section>
)
