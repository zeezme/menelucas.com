import { pick, type Translator } from '../../internationalization'
import type { Locale, Resume, Work } from '../../schema/resume'
import { BulletList } from '../BulletList'
import { DateRange } from '../DateRange'
import { Section } from '../Section'

interface ExperienceSectionProps {
  resume: Resume
  locale: Locale
  translate: Translator
}

interface JobCardProps {
  job: Work
  locale: Locale
  translate: Translator
}

const JobCard = ({ job, locale, translate }: JobCardProps) => (
  <article className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5">
    <header>
      <h3 className="text-lg font-semibold leading-snug tracking-title">{pick(job.position, locale)}</h3>
      <p className="mt-1 text-sm text-ink-muted">
        <span translate="no" className="font-medium text-ink">
          {job.name}
        </span>
        <span aria-hidden="true"> · </span>
        <span className="tabular-nums">
          <DateRange startDate={job.startDate} endDate={job.endDate} locale={locale} />
        </span>
        <span aria-hidden="true"> · </span>
        {pick(job.location, locale)}
      </p>
    </header>
    {job.summary ? (
      <p className="max-w-[75ch] text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">{pick(job.summary, locale)}</p>
    ) : null}
    {job.keywords ? (
      <p className="text-sm text-ink-muted">
        <span className="font-medium text-ink">{translate('stack')}:</span>{' '}
        <span translate="no">{job.keywords.join(', ')}</span>
      </p>
    ) : null}
    {job.sections?.map((section) => (
      <div key={section.title.en} className="flex flex-col gap-2">
        <h4 className="text-pretty text-sm font-medium text-ink">{pick(section.title, locale)}</h4>
        <BulletList items={section.highlights} locale={locale} className="max-w-[75ch]" />
      </div>
    ))}
    {job.highlights ? <BulletList items={job.highlights} locale={locale} className="max-w-[75ch]" /> : null}
  </article>
)

/** Experiência profissional, uma caixa por empresa. */
export const ExperienceSection = ({ resume, locale, translate }: ExperienceSectionProps) => (
  <Section id="experience" title={translate('experience')}>
    <div className="flex flex-col gap-4">
      {resume.work.map((job) => (
        <JobCard key={job.id} job={job} locale={locale} translate={translate} />
      ))}
    </div>
  </Section>
)
