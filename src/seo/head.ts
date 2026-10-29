import type { Locale, Resume } from '../schema/resume'
import { showcaseProjects } from '../schema/resume'
import { firstSentence, localePath, pagePath, pick, roleOf, type PageId } from '../internationalization'
import { openGraphImagePath, type SiteConfig } from '../site'

/** Espaço que não quebra linha: mantém o cargo inteiro numa linha só quando o navegador quebra o título (ex.: na dica da aba). */
const NO_BREAK_SPACE = ' '

const OPEN_GRAPH_LOCALES: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' }

/** Metadados de uma página para o `<head>`. */
export interface HeadMeta {
  title: string
  description: string
  keywords: string
  canonical: string
  alternates: { locale: Locale | 'x-default'; href: string }[]
  image: string
  /** Perfis públicos (LinkedIn, GitHub) que apontam para esta pessoa; viram `<link rel="me">`. */
  profileLinks: string[]
  /** Dados estruturados (schema.org) da pessoa; nunca incluem projetos. */
  jsonLd: Record<string, unknown>
}

/** Todas as competências do idioma, sem repetir, para palavras-chave de busca e dados estruturados. */
export const skillKeywords = (resume: Resume, locale: Locale): string[] => [
  ...new Set(resume.skills.flatMap((group) => group.keywords[locale])),
]

/** Locale do Open Graph (`pt_BR`, `en_US`) para o idioma. */
export const openGraphLocale = (locale: Locale): string => OPEN_GRAPH_LOCALES[locale]

/** Último trecho do endereço de um perfil, que é o usuário na rede (`.../in/meneluca` → `meneluca`). */
const handleOf = (profileUrl: string): string => new URL(profileUrl).pathname.split('/').filter(Boolean).pop() ?? ''

/**
 * Monta os metadados de SEO de uma página, todos derivados de `resume.json`.
 * @param resume Currículo validado.
 * @param locale Idioma da página.
 * @param site Configuração de publicação.
 * @param page Página a descrever.
 * @param pageLabel Nome da página nos títulos que não vêm do currículo (ex.: "Projetos").
 */
export const buildHeadMeta = (
  resume: Resume,
  locale: Locale,
  site: SiteConfig,
  page: PageId = 'resume',
  pageLabel = '',
): HeadMeta => {
  const { basics } = resume
  const absoluteUrl = (path: string) => `${site.origin}${path}`
  const image = absoluteUrl(`/${openGraphImagePath(site, locale)}`)
  const label = pick(basics.label, locale)
  const role = roleOf(label)
  const pageUrl = (targetLocale: Locale) => absoluteUrl(pagePath(page, targetLocale, site.base))
  const resumeUrl = (targetLocale: Locale) => absoluteUrl(localePath(targetLocale, site.base))
  const description = firstSentence(pick(basics.summary, locale))
  const keywords = skillKeywords(resume, locale)
  const personId = `${resumeUrl('pt')}#person`
  const latestJob = resume.work[0]
  const education = resume.education[0]
  const alternates: HeadMeta['alternates'] = [
    { locale: 'pt', href: pageUrl('pt') },
    { locale: 'en', href: pageUrl('en') },
    { locale: 'x-default', href: pageUrl('pt') },
  ]

  const publicProfiles = basics.profiles.filter((profile) => profile.network !== 'WhatsApp')
  const profileLinks = publicProfiles.map((profile) => profile.url)
  const alternateNames = [...new Set([...(basics.alternateNames ?? []), ...publicProfiles.map((profile) => handleOf(profile.url))])]

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: basics.name,
    alternateName: alternateNames,
    jobTitle: role,
    description,
    url: resumeUrl(locale),
    email: `mailto:${basics.email}`,
    image: absoluteUrl(`${site.base}avatar.webp`),
    sameAs: profileLinks,
    address: {
      '@type': 'PostalAddress',
      addressLocality: basics.location.city,
      addressRegion: basics.location.region,
      addressCountry: basics.location.countryCode,
    },
    knowsAbout: keywords,
    knowsLanguage: resume.languages.map((language) => language.code),
    ...(education
      ? { alumniOf: { '@type': 'CollegeOrUniversity', name: pick(education.institution, locale) } }
      : {}),
    ...(latestJob
      ? {
          hasOccupation: {
            '@type': 'Occupation',
            name: pick(latestJob.position, locale),
            skills: keywords.join(', '),
            occupationLocation: { '@type': 'Country', name: basics.location.countryCode },
          },
        }
      : {}),
  }

  if (page === 'projects') {
    const firstProject = showcaseProjects(resume)[0]
    return {
      title: `${pageLabel} — ${basics.name}`,
      description: firstProject ? pick(firstProject.description, locale) : description,
      keywords: '',
      canonical: pageUrl(locale),
      alternates,
      image,
      profileLinks,
      jsonLd: { '@context': 'https://schema.org', '@graph': [person] },
    }
  }

  return {
    title: `${basics.name} ${role.replaceAll(' ', NO_BREAK_SPACE)}`,
    description: `${basics.name}: ${description}`,
    keywords: keywords.join(', '),
    canonical: pageUrl(locale),
    alternates,
    image,
    profileLinks,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        person,
        {
          '@type': 'ProfilePage',
          '@id': `${pageUrl(locale)}#profile`,
          url: pageUrl(locale),
          name: `${basics.name} ${role}`,
          description,
          inLanguage: locale === 'pt' ? 'pt-BR' : 'en',
          mainEntity: { '@id': personId },
          primaryImageOfPage: image,
        },
      ],
    },
  }
}

/**
 * Gera o `sitemap.xml` com cada página em PT e EN e as alternativas de idioma (hreflang).
 * @param site Configuração de publicação.
 * @param pages Páginas publicadas.
 * @param now Data usada em `lastmod`.
 */
export const buildSitemap = (site: SiteConfig, pages: PageId[] = ['resume'], now = new Date()): string => {
  const lastModified = now.toISOString().slice(0, 10)
  const entries = pages
    .flatMap((page) => {
      const urls = (['pt', 'en'] as const).map((locale) => `${site.origin}${pagePath(page, locale, site.base)}`)
      const alternateLinks = [
        `    <xhtml:link rel="alternate" hreflang="pt" href="${urls[0]}"/>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${urls[1]}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${urls[0]}"/>`,
      ].join('\n')
      return urls.map(
        (location) => `  <url>\n    <loc>${location}</loc>\n    <lastmod>${lastModified}</lastmod>\n${alternateLinks}\n  </url>`,
      )
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`
}

/** Gera o `robots.txt`, apontando para o sitemap. */
export const buildRobots = (site: SiteConfig): string =>
  `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}${site.base}sitemap.xml\n`
