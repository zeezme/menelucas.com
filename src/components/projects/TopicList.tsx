import { pick } from '../../internationalization'
import type { Area, Locale } from '../../schema/resume'

type Topic = NonNullable<Area['topics']>[number]

interface TopicListProps {
  topics: Topic[]
  locale: Locale
}

/**
 * Tópicos sem caixas: filetes finos separam os grupos, e o título (nível secundário) fica ao lado do texto
 * em telas largas ou acima dele no celular. O espaço dentro de um tópico é menor que o espaço entre tópicos,
 * então o agrupamento aparece sem borda ou fundo.
 */
export const TopicList = ({ topics, locale }: TopicListProps) => (
  <dl className="flex flex-col divide-y divide-hairline border-y border-hairline">
    {topics.map((topic) => (
      <div key={topic.title.en} className="grid gap-1 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
        <dt className="text-sm font-semibold text-ink">{pick(topic.title, locale)}</dt>
        <dd className="text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">{pick(topic.text, locale)}</dd>
      </div>
    ))}
  </dl>
)
