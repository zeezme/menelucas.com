import type { ReactNode } from 'react'
import type { Locale, Resume } from '../schema/resume'
import { labelTags, localePath, pick, roleOf, type T } from '../i18n'
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, MoonIcon, SunIcon, WhatsAppIcon } from './icons'

interface Props {
  resume: Resume
  locale: Locale
  base: string
  t: T
}

/**
 * Mobile: botão com ícone e nome visíveis. Desktop (sm+): só o ícone; o nome continua
 * no texto `sr-only`, que também é o nome acessível (sem aria-label divergente do texto visível).
 */
const contactLink =
  'inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-btn border border-hairline bg-surface-1 px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink ' +
  'sm:w-auto sm:min-w-touch sm:border-transparent sm:bg-transparent sm:px-0 sm:text-ink-subtle'

function ContactLink({ href, label, rel, children }: { href: string; label: string; rel?: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} className={contactLink} {...(rel ? { rel } : {})}>
        {children}
        <span className="sm:sr-only">{label}</span>
      </a>
    </li>
  )
}

export function LangToggle({
  locale,
  hrefFor,
  t,
}: {
  locale: Locale
  hrefFor: (locale: Locale) => string
  t: T
}) {
  const options: { locale: Locale; label: string }[] = [
    { locale: 'pt', label: 'PT' },
    { locale: 'en', label: 'EN' },
  ]
  return (
    <nav aria-label={t('languageNav')}>
      <ul className="flex overflow-hidden rounded-btn border border-hairline bg-surface-1">
        {options.map((o) => {
          const active = o.locale === locale
          return (
            <li key={o.locale}>
              <a
                href={hrefFor(o.locale)}
                hrefLang={o.locale}
                lang={o.locale}
                data-lang={o.locale}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[42px] min-w-[48px] items-center justify-center px-3 text-sm font-medium transition-colors ${
                  active ? 'bg-surface-3 text-ink' : 'text-ink-subtle hover:text-ink'
                }`}
              >
                {o.label}
                {/* O nome acessível começa com o texto visível (WCAG 2.5.3). */}
                <span className="sr-only"> — {t(o.locale === 'pt' ? 'langPt' : 'langEn')}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Sem display utilitário: a visibilidade (só com JS) vem de [data-theme-toggle] em main.css. */
export function ThemeToggle({ t }: { t: T }) {
  return (
    <button
      type="button"
      data-theme-toggle
      aria-label={t('themeToggle')}
      className="min-h-touch min-w-touch items-center justify-center rounded-btn border border-hairline bg-surface-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  )
}

export function Header({ resume, locale, base, t }: Props) {
  const { basics, meta } = resume
  const label = pick(basics.label, locale)
  const profile = (network: string) => basics.profiles.find((p) => p.network === network)
  const linkedin = profile('LinkedIn')
  const github = profile('GitHub')
  const whatsapp = profile('WhatsApp')
  const tags = labelTags(label)

  return (
    <header className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:col-start-1 sm:row-start-1 sm:gap-5">
        <img
          src={`${base}avatar.webp`}
          alt={t('avatarAlt')}
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-full border border-hairline bg-surface-2 object-cover"
          fetchPriority="high"
        />
        <div className="min-w-0">
          <h1 translate="no" className="text-balance text-[1.625rem] font-semibold leading-[1.1] tracking-display sm:text-[2.25rem]">
            {basics.name}
          </h1>
          <p className="mt-1 text-base font-medium text-ink-muted sm:text-lg">{roleOf(label)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-ink-subtle sm:col-span-2">
        {tags ? <p className="text-pretty">{tags}</p> : null}
        <p>{pick(basics.location.note, locale)}</p>
      </div>

      {/* Mobile: grupo próprio no fim, separado das ações por divisor e rótulo (proximidade = agrupamento). */}
      <nav
        aria-label={t('contactNav')}
        className="order-last mt-1 border-t border-hairline pt-5 sm:order-none sm:col-start-2 sm:row-start-1 sm:mt-0 sm:border-0 sm:pt-0"
      >
        <p aria-hidden="true" className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle sm:hidden">
          {t('contactNav')}
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:-mr-2 sm:flex sm:gap-0">
          {linkedin ? (
            <ContactLink href={linkedin.url} label={linkedin.network} rel="me noopener">
              <LinkedInIcon />
            </ContactLink>
          ) : null}
          {github ? (
            <ContactLink href={github.url} label={github.network} rel="me noopener">
              <GitHubIcon />
            </ContactLink>
          ) : null}
          {whatsapp ? (
            <ContactLink href={whatsapp.url} label={whatsapp.network} rel="noopener">
              <WhatsAppIcon />
            </ContactLink>
          ) : null}
          <ContactLink href={`mailto:${basics.email}`} label={t('emailText')}>
            <MailIcon />
          </ContactLink>
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 sm:col-span-2 sm:gap-x-4">
        <LangToggle locale={locale} hrefFor={(l) => localePath(l, base)} t={t} />
        <ThemeToggle t={t} />
        <a
          href={`${base}${meta.pdf[locale].slice(1)}`}
          download
          className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-btn bg-accent-solid px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:ml-auto sm:flex-none"
        >
          <DownloadIcon />
          {t('downloadPdf')}
        </a>
      </div>
    </header>
  )
}
