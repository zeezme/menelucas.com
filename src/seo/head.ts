import type { Locale, Resume } from '../schema/resume'
import { firstSentence, localePath, pagePath, pick, roleOf, type PageId } from '../i18n'
import { showcaseProjects } from '../schema/resume'
import { ogImagePath, type SiteConfig } from '../site'

const OG_LOCALE: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' }

export interface HeadMeta {
  title: string
  description: string
  keywords: string
  canonical: string
  alternates: { locale: Locale | 'x-default'; href: string }[]
  image: string
  /** Nulo nas páginas que não devem ter dados estruturados (ex.: Projetos). */
  jsonLd: Record<string, unknown> | null
}

const unique = (items: string[]): string[] => [...new Set(items)]

/** Palavras-chave de busca: todas as competências do idioma, sem repetir. */
export const skillKeywords = (resume: Resume, locale: Locale): string[] =>
  unique(resume.skills.flatMap((group) => group.keywords[locale]))

/** Metadados de SEO de uma página, todos derivados do resume.json (nada é escrito à mão aqui). */
export function buildHeadMeta(
  resume: Resume,
  locale: Locale,
  site: SiteConfig,
  page: PageId = 'resume',
  pageLabel = '',
): HeadMeta {
  const { basics } = resume
  const abs = (path: string) => `${site.origin}${path}`
  const ogImage = abs(`/${ogImagePath(site, locale)}`)
  const label = pick(basics.label, locale)
  const role = roleOf(label)
  const url = (l: Locale) => abs(pagePath(page, l, site.base))
  const resumeUrl = (l: Locale) => abs(localePath(l, site.base))
  const description = firstSentence(pick(basics.summary, locale))
  const keywords = skillKeywords(resume, locale)
  const personId = `${resumeUrl('pt')}#person`
  const latest = resume.work[0]
  const alumni = resume.education[0]

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: basics.name,
    ...(basics.alternateNames ? { alternateName: basics.alternateNames } : {}),
    jobTitle: role,
    description,
    url: resumeUrl(locale),
    email: `mailto:${basics.email}`,
    image: abs(`${site.base}avatar.webp`),
    sameAs: basics.profiles.filter((p) => p.network !== 'WhatsApp').map((p) => p.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: basics.location.city,
      addressRegion: basics.location.region,
      addressCountry: basics.location.countryCode,
    },
    knowsAbout: keywords,
    knowsLanguage: resume.languages.map((l) => l.code),
    ...(alumni
      ? { alumniOf: { '@type': 'CollegeOrUniversity', name: pick(alumni.institution, locale) } }
      : {}),
    ...(latest
      ? {
          hasOccupation: {
            '@type': 'Occupation',
            name: pick(latest.position, locale),
            skills: keywords.join(', '),
            occupationLocation: { '@type': 'Country', name: basics.location.countryCode },
          },
        }
      : {}),
  }

  if (page === 'projects') {
    const first = showcaseProjects(resume)[0]
    return {
      title: `${pageLabel} — ${basics.name}`,
      description: first ? pick(first.description, locale) : description,
      keywords: '',
      canonical: url(locale),
      alternates: [
        { locale: 'pt', href: url('pt') },
        { locale: 'en', href: url('en') },
        { locale: 'x-default', href: url('pt') },
      ],
      image: ogImage,
      jsonLd: { '@context': 'https://schema.org', '@graph': [person] },
    }
  }

  return {
    title: label,
    description,
    keywords: keywords.join(', '),
    canonical: url(locale),
    alternates: [
      { locale: 'pt', href: url('pt') },
      { locale: 'en', href: url('en') },
      { locale: 'x-default', href: url('pt') },
    ],
    image: ogImage,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        person,
        {
          '@type': 'ProfilePage',
          '@id': `${url(locale)}#profile`,
          url: url(locale),
          name: `${basics.name} — ${role}`,
          description,
          inLanguage: locale === 'pt' ? 'pt-BR' : 'en',
          mainEntity: { '@id': personId },
          primaryImageOfPage: ogImage,
        },
      ],
    },
  }
}

export const ogLocale = (locale: Locale): string => OG_LOCALE[locale]

const lastmod = (date: Date) => date.toISOString().slice(0, 10)

/** sitemap.xml com as páginas (PT e EN) e as alternativas de idioma (hreflang). */
export function buildSitemap(site: SiteConfig, pages: PageId[] = ['resume'], now = new Date()): string {
  const entries = pages
    .flatMap((page) => {
      const urls = (['pt', 'en'] as const).map((l) => `${site.origin}${pagePath(page, l, site.base)}`)
      const links = [
        `    <xhtml:link rel="alternate" hreflang="pt" href="${urls[0]}"/>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${urls[1]}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${urls[0]}"/>`,
      ].join('\n')
      return urls.map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod(now)}</lastmod>\n${links}\n  </url>`)
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`
}

export const buildRobots = (site: SiteConfig): string =>
  `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}${site.base}sitemap.xml\n`
