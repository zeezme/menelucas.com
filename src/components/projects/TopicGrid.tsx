import { pick } from '../../internationalization'
import type { Area, Locale } from '../../schema/resume'

type Topic = NonNullable<Area['topics']>[number]

interface TopicGridProps {
  topics: Topic[]
  locale: Locale
}

/** Tópicos em grade de cartões: título curto e texto, em vez de uma lista longa de marcadores. */
export const TopicGrid = ({ topics, locale }: TopicGridProps) => (
  <dl className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    {topics.map((topic) => (
      <div key={topic.title.en} className="rounded-xl border border-hairline bg-surface-1 p-4">
        <dt className="text-sm font-semibold text-ink">{pick(topic.title, locale)}</dt>
        <dd className="mt-1.5 text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">{pick(topic.text, locale)}</dd>
      </div>
    ))}
  </dl>
)
