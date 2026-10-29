import type { Area, GalleryItem, Locale, Project, Resume, Snippet, UiStrings } from '../schema/resume'
import { showcaseProjects } from '../schema/resume'
import { createT, formatYearMonth, localePath, pagePath, pick, type T } from '../i18n'
import { areasScript } from '../seo/areas-script'
import { LangToggle, ThemeToggle } from './Header'
import { TabNav } from './TabNav'

interface Props {
  resume: Resume
  ui: UiStrings
  locale: Locale
  base: string
}

const slugOf = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const headingClass = 'text-xl font-semibold leading-snug tracking-title'
const listClass =
  'flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted marker:text-ink-subtle'

function Bullets({ items, locale }: { items: { pt: string; en: string }[]; locale: Locale }) {
  return (
    <ul className={listClass}>
      {items.map((item) => (
        <li key={item.en} className="text-pretty">
          {pick(item, locale)}
        </li>
      ))}
    </ul>
  )
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

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- o bloco rola na horizontal e precisa de foco por teclado (axe: scrollable-region-focusable) */
function CodeBlock({ snippet, locale }: { snippet: Snippet; locale: Locale }) {
  return (
    <figure className="flex flex-col gap-3">
      <pre
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-hairline bg-surface-1 p-4 text-[0.8125rem] leading-relaxed text-ink-muted"
      >
        <code data-language={snippet.language}>{snippet.code}</code>
      </pre>
      <figcaption className="text-pretty text-sm leading-relaxed text-ink-muted">{pick(snippet.caption, locale)}</figcaption>
    </figure>
  )
}

/* eslint-enable jsx-a11y/no-noninteractive-tabindex */

function Overview({ project, id, locale, t }: { project: Project; id: string; locale: Locale; t: T }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-8 scroll-mt-6">
      <div className="flex flex-col gap-4">
        <h3 id={`${id}-title`} className={headingClass}>
          {t('overview')}
        </h3>
        <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(project.description, locale)}</p>
        <Bullets items={project.highlights} locale={locale} />
      </div>
      {(project.detailSections ?? []).map((section) => (
        <section key={section.title.en} aria-labelledby={`${id}-${slugOf(section.title.en)}`} className="flex flex-col gap-3">
          <h4 id={`${id}-${slugOf(section.title.en)}`} className="text-lg font-semibold leading-snug tracking-title">
            {pick(section.title, locale)}
          </h4>
          <Bullets items={section.items} locale={locale} />
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
    </section>
  )
}

function AreaPanel({ area, id, project, locale, base }: { area: Area; id: string; project: Project; locale: Locale; base: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 scroll-mt-6">
      <div className="flex flex-col gap-4">
        <h3 id={`${id}-title`} className={headingClass}>
          {pick(area.title, locale)}
        </h3>
        <p className="text-pretty text-base leading-relaxed text-ink-muted">{pick(area.summary, locale)}</p>
        {area.points ? <Bullets items={area.points} locale={locale} /> : null}
      </div>
      {(area.snippets ?? []).map((snippet) => (
        <CodeBlock key={snippet.code} snippet={snippet} locale={locale} />
      ))}
      {area.gallery && project.galleryNote ? <p className="text-sm text-ink-subtle">{pick(project.galleryNote, locale)}</p> : null}
      {(area.gallery ?? []).map((item) => (
        <Figure key={item.src} item={item} locale={locale} base={base} />
      ))}
    </section>
  )
}

function ProjectDetail({ project, locale, base, t }: { project: Project; locale: Locale; base: string; t: T }) {
  const slug = slugOf(project.name)
  const panels = [
    { id: `${slug}-overview`, label: t('overview') },
    ...(project.areas ?? []).map((area) => ({ id: `${slug}-${slugOf(area.title.en)}`, label: pick(area.title, locale) })),
  ]
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

      <div className="grid gap-8 md:grid-cols-[13.5rem_minmax(0,1fr)] md:items-start">
        <nav
          aria-label={t('partsNav')}
          data-areas-nav
          className="rounded-xl border border-hairline bg-surface-1 p-2 md:sticky md:top-6"
        >
          <ul className="flex flex-wrap gap-1 md:flex-col">
            {panels.map((panel) => (
              <li key={panel.id} className="md:w-full">
                <a
                  href={`#${panel.id}`}
                  className="inline-flex min-h-touch items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink aria-[current=true]:bg-surface-3 aria-[current=true]:text-ink md:w-full md:min-h-[42px]"
                >
                  {panel.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <Overview project={project} id={panels[0]?.id ?? `${slug}-overview`} locale={locale} t={t} />
          {(project.areas ?? []).map((area, i) => (
            <AreaPanel key={area.title.en} area={area} id={panels[i + 1]?.id ?? ''} project={project} locale={locale} base={base} />
          ))}
          <nav aria-label={t('pagerNav')} data-areas-pager hidden className="flex items-stretch justify-between gap-3 border-t border-hairline pt-6 print:hidden">
            {(['prev', 'next'] as const).map((dir) => (
              <a
                key={dir}
                href="#"
                data-pager={dir}
                className={`flex min-h-touch min-w-0 max-w-[48%] flex-col justify-center gap-0.5 rounded-xl border border-hairline bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2 ${dir === 'next' ? 'ml-auto text-right' : ''}`}
              >
                <span className="text-xs text-ink-subtle">{t(dir === 'prev' ? 'prevPart' : 'nextPart')}</span>
                <span data-pager-name className="text-sm font-medium text-ink"></span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </article>
  )
}

/** Página `/projetos/` (e `/en/projects/`): detalhes do projeto, com uma barra lateral das partes do sistema. */
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-16">
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
      <script dangerouslySetInnerHTML={{ __html: areasScript }} />
    </>
  )
}
