import type { Locale, Resume } from '../schema/resume'
import { firstSentence, localePath, pick, roleOf } from '../i18n'
import { OG_IMAGE, type SiteConfig } from '../site'

const OG_LOCALE: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' }

export interface HeadMeta {
  title: string
  description: string
  canonical: string
  alternates: { locale: Locale | 'x-default'; href: string }[]
  image: string
  jsonLd: Record<string, unknown>
}

/** Metadados de SEO de uma página, todos derivados do resume.json. */
export function buildHeadMeta(resume: Resume, locale: Locale, site: SiteConfig): HeadMeta {
  const { basics } = resume
  const abs = (path: string) => `${site.origin}${path}`
  const role = roleOf(pick(basics.label, locale))
  const url = (l: Locale) => abs(localePath(l, site.base))
  const profileUrls = basics.profiles
    .filter((p) => p.network !== 'WhatsApp')
    .map((p) => p.url)
  const core = resume.skills[0]

  return {
    title: `${basics.name} — ${role}`,
    description: firstSentence(pick(basics.summary, locale)),
    canonical: url(locale),
    alternates: [
      { locale: 'pt', href: url('pt') },
      { locale: 'en', href: url('en') },
      { locale: 'x-default', href: url('pt') },
    ],
    image: abs(`/${OG_IMAGE.path}`),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: basics.name,
      jobTitle: role,
      description: firstSentence(pick(basics.summary, locale)),
      url: url(locale),
      email: `mailto:${basics.email}`,
      image: abs(`${site.base}avatar.webp`),
      sameAs: profileUrls,
      address: {
        '@type': 'PostalAddress',
        addressLocality: basics.location.city,
        addressRegion: basics.location.region,
        addressCountry: basics.location.countryCode,
      },
      ...(core ? { knowsAbout: core.keywords[locale] } : {}),
    },
  }
}

export const ogLocale = (locale: Locale): string => OG_LOCALE[locale]
