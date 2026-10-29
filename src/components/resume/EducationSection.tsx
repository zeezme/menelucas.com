import { pick, type Translator } from '../../internationalization'
import type { Locale, Resume } from '../../schema/resume'
import { Section } from '../Section'

interface EducationSectionProps {
  resume: Resume
  locale: Locale
  translate: Translator
}

/** Formação acadêmica. */
export const EducationSection = ({ resume, locale, translate }: EducationSectionProps) => (
  <Section id="education" title={translate('education')}>
    <ul className="flex flex-col gap-4">
      {resume.education.map((entry) => (
        <li key={entry.area.en}>
          <p className="font-medium">{pick(entry.area, locale)}</p>
          <p className="text-sm text-ink-muted">
            {pick(entry.institution, locale)}
            <span aria-hidden="true"> · </span>
            {pick(entry.status, locale)}
          </p>
        </li>
      ))}
    </ul>
  </Section>
)
