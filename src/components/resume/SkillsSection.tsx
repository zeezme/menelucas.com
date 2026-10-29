import { pick, type Translator } from '../../internationalization'
import type { Locale, Resume } from '../../schema/resume'
import { Section } from '../Section'

interface SkillsSectionProps {
  resume: Resume
  locale: Locale
  translate: Translator
}

/** Competências, agrupadas por categoria. */
export const SkillsSection = ({ resume, locale, translate }: SkillsSectionProps) => (
  <Section id="skills" title={translate('skills')}>
    <dl className="flex flex-col gap-5">
      {resume.skills.map((group) => (
        <div key={group.name.en}>
          <dt className="mb-2 text-sm font-medium text-ink">{pick(group.name, locale)}</dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {group.keywords[locale].map((keyword) => (
                <li
                  key={keyword}
                  className="rounded-full border border-hairline bg-surface-1 px-2.5 py-0.5 text-[0.8125rem] text-ink-muted"
                >
                  {keyword}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  </Section>
)
