import type { ReactNode } from 'react'
import type { Locale, Project, Resume, Work } from '../schema/resume'
import { formatYearMonth, pick, type T } from '../i18n'

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-hairline pt-8">
      <h2 id={`${id}-title`} className="mb-5 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Summary({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  return (
    <Section id="summary" title={t('summary')}>
      <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(resume.basics.summary, locale)}</p>
    </Section>
  )
}

export function Skills({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  return (
    <Section id="skills" title={t('skills')}>
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
}

function Bullets({ items, locale }: { items: { pt: string; en: string }[]; locale: Locale }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle">
      {items.map((item) => (
        <li key={item.en} className="text-pretty">
          {pick(item, locale)}
        </li>
      ))}
    </ul>
  )
}

interface DateRange {
  startDate: string
  endDate?: string | undefined
}

/** `02/2026 – 09/2026`; sem data final mostra `present` ("atual"/"present") quando informado. */
function Period({ range, locale, present }: { range: DateRange; locale: Locale; present?: string }) {
  return (
    <>
      <time dateTime={range.startDate}>{formatYearMonth(range.startDate, locale)}</time>
      {' – '}
      {range.endDate ? <time dateTime={range.endDate}>{formatYearMonth(range.endDate, locale)}</time> : present}
    </>
  )
}

function Job({ job, locale }: { job: Work; locale: Locale }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5">
      <header>
        <h3 className="text-lg font-semibold leading-snug tracking-title">{pick(job.position, locale)}</h3>
        <p className="mt-1 text-sm text-ink-muted">
          <span translate="no" className="font-medium text-ink">{job.name}</span>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            <Period range={job} locale={locale} />
          </span>
          <span aria-hidden="true"> · </span>
          {pick(job.location, locale)}
        </p>
      </header>
      {job.summary ? (
        <p className="text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">{pick(job.summary, locale)}</p>
      ) : null}
      {job.sections?.map((section) => (
        <div key={section.title.en} className="flex flex-col gap-2">
          <h4 className="text-pretty text-sm font-medium text-ink">{pick(section.title, locale)}</h4>
          <Bullets items={section.highlights} locale={locale} />
        </div>
      ))}
      {job.highlights ? <Bullets items={job.highlights} locale={locale} /> : null}
    </article>
  )
}

export function Experience({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  return (
    <Section id="experience" title={t('experience')}>
      <div className="flex flex-col gap-4">
        {resume.work.map((job) => (
          <Job key={job.id} job={job} locale={locale} />
        ))}
      </div>
    </Section>
  )
}

function ProjectItem({ project, locale, t }: { project: Project; locale: Locale; t: T }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5">
      <header>
        <h3 translate="no" className="text-lg font-semibold leading-snug tracking-title">
          {project.name}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{pick(project.roles, locale)}</span>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            <Period range={project} locale={locale} present={t('present')} />
          </span>
        </p>
      </header>
      <p className="text-pretty text-[0.9375rem] leading-relaxed text-ink-muted">{pick(project.description, locale)}</p>
      <Bullets items={project.highlights} locale={locale} />
    </article>
  )
}

/** Seção opcional: some quando `projects` está ausente ou vazio (tirar o item do JSON basta). */
export function Projects({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  const projects = resume.projects ?? []
  if (projects.length === 0) return null
  return (
    <Section id="projects" title={t('projects')}>
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <ProjectItem key={project.name} project={project} locale={locale} t={t} />
        ))}
      </div>
    </Section>
  )
}

export function Education({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  return (
    <Section id="education" title={t('education')}>
      <ul className="flex flex-col gap-4">
        {resume.education.map((e) => (
          <li key={e.area.en}>
            <p className="font-medium">{pick(e.area, locale)}</p>
            <p className="text-sm text-ink-muted">
              {pick(e.institution, locale)}
              <span aria-hidden="true"> · </span>
              {pick(e.status, locale)}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Languages({ resume, locale, t }: { resume: Resume; locale: Locale; t: T }) {
  return (
    <Section id="languages" title={t('languages')}>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
        {resume.languages.map((l) => (
          <li key={l.language.en}>
            <span className="font-medium">{pick(l.language, locale)}</span>
            <span className="text-ink-muted"> ({pick(l.fluency, locale)})</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
