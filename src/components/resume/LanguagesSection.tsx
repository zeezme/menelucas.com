import { pick, type Translator } from '../../internationalization'
import type { Locale, Resume } from '../../schema/resume'
import { Section } from '../Section'

interface LanguagesSectionProps {
  resume: Resume
  locale: Locale
  translate: Translator
}

/** Idiomas falados e o nível de cada um. */
export const LanguagesSection = ({ resume, locale, translate }: LanguagesSectionProps) => (
  <Section id="languages" title={translate('languages')}>
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
      {resume.languages.map((entry) => (
        <li key={entry.language.en}>
          <span className="font-medium">{pick(entry.language, locale)}</span>
          <span className="text-ink-muted"> ({pick(entry.fluency, locale)})</span>
        </li>
      ))}
    </ul>
  </Section>
)
