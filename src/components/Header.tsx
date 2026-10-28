import type { Locale, Resume } from '../schema/resume'
import { labelTags, localePath, otherLocale, pick, roleOf, type T } from '../i18n'
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, WhatsAppIcon } from './icons'

interface Props {
  resume: Resume
  locale: Locale
  base: string
  t: T
}

const iconLink =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-btn text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink'

function LangToggle({ locale, base, t }: Pick<Props, 'locale' | 'base' | 't'>) {
  const options: { locale: Locale; label: string }[] = [
    { locale: 'pt', label: 'PT' },
    { locale: 'en', label: 'EN' },
  ]
  return (
    <nav aria-label={t('languageNav')}>
      <ul className="flex gap-1 rounded-full border border-hairline bg-surface-1 p-1">
        {options.map((o) => {
          const active = o.locale === locale
          return (
            <li key={o.locale}>
              <a
                href={localePath(o.locale, base)}
                hrefLang={o.locale}
                lang={o.locale}
                data-lang={o.locale}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[36px] min-w-[44px] items-center justify-center rounded-full px-3 text-sm font-medium transition-colors sm:min-h-[32px] ${
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

export function Header({ resume, locale, base, t }: Props) {
  const { basics, meta } = resume
  const label = pick(basics.label, locale)
  const profile = (network: string) => basics.profiles.find((p) => p.network === network)
  const linkedin = profile('LinkedIn')
  const github = profile('GitHub')
  const whatsapp = profile('WhatsApp')
  const tags = labelTags(label)

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <img
          src={`${base}avatar.webp`}
          alt={t('avatarAlt')}
          width={80}
          height={80}
          className="h-16 w-16 shrink-0 rounded-full border border-hairline bg-surface-2 object-cover sm:h-20 sm:w-20"
          fetchPriority="high"
        />
        <div className="min-w-0">
          <h1 translate="no" className="text-balance text-[1.75rem] font-semibold leading-[1.1] tracking-display sm:text-[2.25rem]">
            {basics.name}
          </h1>
          <p className="mt-1 text-lg font-medium text-ink-muted">{roleOf(label)}</p>
        </div>
      </div>
      {tags ? <p className="text-pretty text-sm text-ink-subtle">{tags}</p> : null}
      <p className="text-sm text-ink-subtle">{pick(basics.location.note, locale)}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav aria-label={t('contactNav')}>
          <ul className="-ml-2 flex items-center">
            {linkedin ? (
              <li>
                <a href={linkedin.url} className={iconLink} aria-label={t('linkedinLabel')} rel="me noopener">
                  <LinkedInIcon />
                </a>
              </li>
            ) : null}
            {github ? (
              <li>
                <a href={github.url} className={iconLink} aria-label={t('githubLabel')} rel="me noopener">
                  <GitHubIcon />
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a href={whatsapp.url} className={iconLink} aria-label={t('whatsappLabel')} rel="noopener">
                  <WhatsAppIcon />
                </a>
              </li>
            ) : null}
            <li>
              <a href={`mailto:${basics.email}`} className={iconLink} aria-label={`${t('emailLabel')}: ${basics.email}`}>
                <MailIcon />
              </a>
            </li>
          </ul>
        </nav>
        <LangToggle locale={locale} base={base} t={t} />
        <a
          href={`${base}${meta.pdf[locale].slice(1)}`}
          download
          className="inline-flex min-h-touch items-center gap-2 rounded-btn bg-accent-solid px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:ml-auto"
        >
          <DownloadIcon />
          {t('downloadPdf')}
        </a>
      </div>
    </header>
  )
}

export { otherLocale }
