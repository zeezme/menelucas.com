import type { ReactNode } from 'react'
import { labelTags, pick, roleOf, type Translator } from '../internationalization'
import type { Locale, Resume } from '../schema/resume'
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, WhatsAppIcon } from './icons'

interface ProfileHeaderProps {
  resume: Resume
  locale: Locale
  base: string
  translate: Translator
}

interface ContactLinkProps {
  href: string
  /** Nome da rede ou do canal; é o nome acessível do link. */
  label: string
  rel?: string
  children: ReactNode
}

/**
 * No celular, botão com ícone e nome visíveis. No desktop (`sm` ou mais), só o ícone; o nome continua no texto
 * `sr-only`, que também é o nome acessível, sem `aria-label` divergente do texto visível.
 */
const CONTACT_LINK_CLASS =
  'inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-btn border border-hairline bg-surface-1 px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink ' +
  'sm:w-auto sm:min-w-touch sm:border-transparent sm:bg-transparent sm:px-0 sm:text-ink-subtle'

const ContactLink = ({ href, label, rel, children }: ContactLinkProps) => (
  <li>
    <a href={href} className={CONTACT_LINK_CLASS} {...(rel ? { rel } : {})}>
      {children}
      <span className="sm:sr-only">{label}</span>
    </a>
  </li>
)

/** Topo do currículo: foto, nome, cargo, contatos e botão de download do PDF. */
export const ProfileHeader = ({ resume, locale, base, translate }: ProfileHeaderProps) => {
  const { basics, meta } = resume
  const label = pick(basics.label, locale)
  const findProfile = (network: string) => basics.profiles.find((profile) => profile.network === network)
  const linkedin = findProfile('LinkedIn')
  const github = findProfile('GitHub')
  const whatsapp = findProfile('WhatsApp')
  const tags = labelTags(label)

  return (
    <div id="profile" className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:col-start-1 sm:row-start-1 sm:gap-5">
        <img
          src={`${base}avatar.webp`}
          alt={translate('avatarAlt')}
          width={136}
          height={136}
          className="h-28 w-28 shrink-0 sm:h-[136px] sm:w-[136px] rounded-full border border-hairline bg-surface-2 object-cover"
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

      <nav
        aria-label={translate('contactNav')}
        className="order-last mt-1 border-t border-hairline pt-5 sm:order-none sm:col-start-2 sm:row-start-1 sm:mt-0 sm:border-0 sm:pt-0"
      >
        <p aria-hidden="true" className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle sm:hidden">
          {translate('contactNav')}
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
          <ContactLink href={`mailto:${basics.email}`} label={translate('emailText')}>
            <MailIcon />
          </ContactLink>
        </ul>
      </nav>

      <a
        href={`${base}${meta.pdf[locale].slice(1)}`}
        download
        className="inline-flex min-h-touch items-center justify-center gap-2 rounded-btn bg-accent-solid px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:col-span-2 sm:justify-self-start"
      >
        <DownloadIcon />
        {translate('downloadPdf')}
      </a>
    </div>
  )
}
