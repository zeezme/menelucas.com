import { pick, type Translator } from '../../internationalization'
import type { Locale, Resume } from '../../schema/resume'
import { Section } from '../Section'

interface SummarySectionProps {
  resume: Resume
  locale: Locale
  translate: Translator
}

/** Resumo profissional. */
export const SummarySection = ({ resume, locale, translate }: SummarySectionProps) => (
  <Section id="summary" title={translate('summary')}>
    <p className="max-w-[75ch] text-pretty text-base leading-relaxed text-ink-muted">{pick(resume.basics.summary, locale)}</p>
  </Section>
)
