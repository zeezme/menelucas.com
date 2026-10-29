import { pick } from '../../internationalization'
import type { Locale, Project } from '../../schema/resume'

type Fact = NonNullable<Project['facts']>[number]

interface FactStripProps {
  facts: Fact[]
  locale: Locale
}

/** Faixa de números em destaque, como "62 migrations versionadas". */
export const FactStrip = ({ facts, locale }: FactStripProps) => (
  <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {facts.map((fact) => (
      <div key={fact.label.en} className="flex flex-col-reverse justify-end gap-1 rounded-xl border border-hairline bg-surface-1 p-4">
        <dt className="text-pretty text-[0.8125rem] leading-snug text-ink-muted">{pick(fact.label, locale)}</dt>
        <dd className="text-2xl font-semibold tabular-nums tracking-title text-ink">{fact.value}</dd>
      </div>
    ))}
  </dl>
)
