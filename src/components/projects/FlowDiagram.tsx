import { pick } from '../../internationalization'
import type { Diagram, Locale } from '../../schema/resume'

type FlowNodeData = Diagram['stages'][number]['nodes'][number]

interface FlowNodeProps {
  node: FlowNodeData
  /** Texto lido por leitores de tela nos blocos planejados, que na tela se distinguem só pelo tracejado. */
  plannedLabel: string
  locale: Locale
  /** Se o bloco está dentro de uma caixa de grupo, que já tem fundo próprio. */
  isNested: boolean
}

interface FlowDiagramProps {
  diagram: Diagram
  locale: Locale
  plannedLabel: string
}

const COLUMNS_BY_NODE_COUNT: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

const Arrow = () => (
  <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true" className="shrink-0">
    <path d="M7 1v18M2 14l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const nodeToneClass = (node: FlowNodeData, isNested: boolean): string => {
  if (node.tone === 'accent') return 'border-accent bg-surface-2'
  if (node.tone === 'future') return 'border-dashed border-hairline-strong bg-surface-1'
  return isNested ? 'border-hairline bg-surface-3' : 'border-hairline bg-surface-2'
}

const FlowNode = ({ node, plannedLabel, locale, isNested }: FlowNodeProps) => (
  <div className={`min-w-0 rounded-lg border px-4 py-3 ${nodeToneClass(node, isNested)}`}>
    <p translate="no" className={`break-words text-sm font-semibold ${node.tone === 'future' ? 'text-ink-muted' : 'text-ink'}`}>
      {pick(node.title, locale)}
      {node.tone === 'future' ? <span className="sr-only"> ({plannedLabel})</span> : null}
    </p>
    {node.detail ? (
      <p className="mt-1 text-pretty text-[0.8125rem] leading-relaxed text-ink-muted">{pick(node.detail, locale)}</p>
    ) : null}
  </div>
)

/** Diagrama de fluxo em HTML e CSS: segue o tema, quebra bem no celular e é lido como uma lista ordenada. */
export const FlowDiagram = ({ diagram, locale, plannedLabel }: FlowDiagramProps) => (
  <figure className="flex flex-col gap-3">
    <div className="rounded-xl border border-hairline bg-surface-1 p-4 sm:p-6">
      <p className="mb-4 text-sm font-semibold text-ink">{pick(diagram.title, locale)}</p>
      <ol className="flex flex-col">
        {diagram.stages.map((stage, stageIndex) => {
          const nodes = (
            <div className={`grid grid-cols-1 gap-3 ${COLUMNS_BY_NODE_COUNT[stage.nodes.length] ?? ''}`}>
              {stage.nodes.map((node) => (
                <FlowNode key={node.title.en} node={node} plannedLabel={plannedLabel} locale={locale} isNested={stage.title !== undefined} />
              ))}
            </div>
          )
          return (
            <li key={stage.title?.en ?? stage.nodes[0]?.title.en ?? stageIndex} className="flex flex-col">
              {stageIndex > 0 ? (
                <div className="flex items-center justify-center gap-2 py-2 text-ink-subtle">
                  <Arrow />
                  {stage.connector ? <span className="text-xs">{pick(stage.connector, locale)}</span> : null}
                </div>
              ) : null}
              {stage.title ? (
                <div className="rounded-xl border border-hairline-strong bg-surface-2 p-3 sm:p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-subtle">{pick(stage.title, locale)}</p>
                  {nodes}
                </div>
              ) : (
                nodes
              )}
            </li>
          )
        })}
      </ol>
    </div>
    <figcaption className="text-pretty text-sm leading-relaxed text-ink-muted">{pick(diagram.caption, locale)}</figcaption>
  </figure>
)
