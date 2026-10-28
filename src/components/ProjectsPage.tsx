import type { GalleryItem, Locale, Project, Resume, UiStrings } from '../schema/resume'
import { showcaseProjects } from '../schema/resume'
import { createT, formatYearMonth, localePath, pagePath, pick, type T } from '../i18n'
import { LangToggle, ThemeToggle } from './Header'
import { TabNav } from './TabNav'

interface Props {
  resume: Resume
  ui: UiStrings
  locale: Locale
  base: string
}

function Figure({ item, locale, base }: { item: GalleryItem; locale: Locale; base: string }) {
  return (
    <figure className="flex flex-col gap-3" style={item.maxWidth ? { maxWidth: `${item.maxWidth}px` } : undefined}>
      <img
        src={`${base}${item.src}`}
        alt={pick(item.alt, locale)}
        width={item.width}
        height={item.height}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-xl border border-hairline bg-surface-1"
      />
      <figcaption className="text-pretty text-sm leading-relaxed text-ink-muted">{pick(item.caption, locale)}</figcaption>
    </figure>
  )
}

const slugOf = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function ProjectDetail({ project, locale, base, t }: { project: Project; locale: Locale; base: string; t: T }) {
  const slug = slugOf(project.name)
  const sections = (project.detailSections ?? []).map((section) => ({
    ...section,
    id: `${slug}-${slugOf(section.title.en)}`,
  }))
  const screensId = `${slug}-screens`
  const index = [
    ...sections.map((section) => ({ id: section.id, label: pick(section.title, locale) })),
    ...(project.gallery ? [{ id: screensId, label: t('screens') }] : []),
  ]
  const headingClass = 'text-lg font-semibold leading-snug tracking-title'
  return (
    <article aria-labelledby={`${slug}-title`} className="flex flex-col gap-8 border-t border-hairline pt-8">
      <header>
        <h2 id={`${slug}-title`} translate="no" className="text-2xl font-semibold leading-tight tracking-title sm:text-[1.75rem]">
          {project.name}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-medium text-ink">{pick(project.roles, locale)}</span>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">
            <time dateTime={project.startDate}>{formatYearMonth(project.startDate, locale)}</time>
            {' – '}
            {project.endDate ? <time dateTime={project.endDate}>{formatYearMonth(project.endDate, locale)}</time> : t('present')}
          </span>
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(project.description, locale)}</p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle">
          {project.highlights.map((item) => (
            <li key={item.en} className="text-pretty">
              {pick(item, locale)}
            </li>
          ))}
        </ul>
      </div>

      {index.length > 1 ? (
        <nav aria-label={t('onThisPage')} className="rounded-xl border border-hairline bg-surface-1 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">{t('onThisPage')}</p>
          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {index.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="inline-flex min-h-touch items-center text-sm text-ink-muted underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
                >
                  {entry.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="flex flex-col gap-3">
          <h3 id={section.id} className={headingClass}>
            {pick(section.title, locale)}
          </h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle">
            {section.items.map((item) => (
              <li key={item.en} className="text-pretty">
                {pick(item, locale)}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {project.notice ? (
        <aside aria-label={t('noteLabel')} className="rounded-xl border border-hairline-strong bg-surface-2 p-5">
          <p className="text-pretty text-sm leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">{t('noteLabel')}. </span>
            {pick(project.notice, locale)}
          </p>
        </aside>
      ) : null}

      {project.gallery ? (
        <section aria-labelledby={screensId} className="flex flex-col gap-6">
          <div>
            <h3 id={screensId} className={headingClass}>
              {t('screens')}
            </h3>
            {project.galleryNote ? <p className="mt-2 text-sm text-ink-subtle">{pick(project.galleryNote, locale)}</p> : null}
          </div>
          {project.gallery.map((item) => (
            <Figure key={item.src} item={item} locale={locale} base={base} />
          ))}
        </section>
      ) : null}
    </article>
  )
}

/** Página `/projetos/` (e `/en/projects/`): detalhes e telas dos projetos com galeria. */
export function ProjectsPage({ resume, ui, locale, base }: Props) {
  const t = createT(ui, locale)
  const projects = showcaseProjects(resume)
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-btn focus:bg-accent-solid focus:px-4 focus:py-3 focus:text-white"
      >
        {t('skipLink')}
      </a>
      <div className="mx-auto flex w-full max-w-prose flex-col gap-8 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 print:hidden">
          <TabNav resume={resume} current="projects" locale={locale} base={base} t={t} />
          <div className="flex items-center gap-3">
            <LangToggle locale={locale} hrefFor={(l) => pagePath('projects', l, base)} t={t} />
            <ThemeToggle t={t} />
          </div>
        </header>
        <main id="content" tabIndex={-1} className="flex flex-col gap-10 outline-none">
          <div>
            <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-display sm:text-[2.25rem]">{t('projects')}</h1>
            <p className="mt-2 text-sm text-ink-subtle">
              <a href={localePath(locale, base)} className="underline decoration-hairline-strong underline-offset-4 hover:text-ink">
                {resume.basics.name}
              </a>
            </p>
          </div>
          {projects.map((project) => (
            <ProjectDetail key={project.name} project={project} locale={locale} base={base} t={t} />
          ))}
        </main>
      </div>
    </>
  )
}
