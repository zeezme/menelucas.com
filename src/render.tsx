import { renderToStaticMarkup } from 'react-dom/server'
import { Page } from './components/Page'
import { ProjectsPage } from './components/ProjectsPage'
import type { Locale, Resume, UiStrings } from './schema/resume'
import { createT, pagePath, type PageId } from './i18n'
import { buildHeadMeta, ogLocale } from './seo/head'
import { redirectScript } from './seo/redirect-script'
import { THEME_COLORS, themeScript } from './seo/theme-script'
import { isIndexable, OG_IMAGE, type SiteConfig } from './site'

interface RenderInput {
  resume: Resume
  ui: UiStrings
  locale: Locale
  site: SiteConfig
  /** Qual página renderizar (padrão: currículo). */
  page?: PageId
  /** CSS já compilado, embutido na página (sem requisição extra). */
  css: string
}

function Document({ resume, ui, locale, site, css, page = 'resume' }: RenderInput) {
  const meta = buildHeadMeta(resume, locale, site, page, createT(ui, locale)('projects'))
  const other: Locale = locale === 'pt' ? 'en' : 'pt'
  return (
    <html
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
      // Só a página PT tenta redirecionar visitantes EN (ver redirect-script.ts).
      {...(locale === 'pt' ? { 'data-en-url': pagePath(page, 'en', site.base) } : {})}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="author" content={resume.basics.name} />
        {meta.keywords ? <meta name="keywords" content={meta.keywords} /> : null}
        <meta
          name="robots"
          content={isIndexable(site) ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}
        />
        <meta name="theme-color" content={THEME_COLORS.dark} media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content={THEME_COLORS.light} media="(prefers-color-scheme: light)" />
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="canonical" href={meta.canonical} />
        {meta.alternates.map((a) => (
          <link key={a.locale} rel="alternate" hrefLang={a.locale} href={a.href} />
        ))}
        <link rel="icon" href={`${site.base}favicon.ico`} sizes="32x32" />
        <link rel="icon" href={`${site.base}favicon.png`} type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href={`${site.base}apple-touch-icon.png`} />
        <meta property="og:type" content={page === 'resume' ? 'profile' : 'website'} />
        {page === 'resume' ? <meta property="profile:username" content="meneluca" /> : null}
        <meta property="og:site_name" content={resume.basics.name} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:locale" content={ogLocale(locale)} />
        <meta property="og:locale:alternate" content={ogLocale(other)} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:image:secure_url" content={meta.image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content={String(OG_IMAGE.width)} />
        <meta property="og:image:height" content={String(OG_IMAGE.height)} />
        <meta property="og:image:alt" content={resume.basics.name} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        <link
          rel="preload"
          href={`${site.base}assets/inter-latin.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {meta.jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(meta.jsonLd).replace(/</g, '\u003c') }}
          />
        ) : null}
      </head>
      <body>
        {page === 'resume' ? (
          <Page resume={resume} ui={ui} locale={locale} base={site.base} />
        ) : (
          <ProjectsPage resume={resume} ui={ui} locale={locale} base={site.base} />
        )}
      </body>
    </html>
  )
}

/** React serializa alguns atributos em camelCase; scrapers simples (WhatsApp, etc.) esperam minúsculas. */
const LOWERCASE_ATTRS = ['charSet', 'hrefLang', 'fetchPriority', 'crossOrigin', 'tabIndex', 'dateTime'] as const

export function renderPage(input: RenderInput): string {
  let html = `<!doctype html>${renderToStaticMarkup(<Document {...input} />)}`
  for (const attr of LOWERCASE_ATTRS) {
    html = html.replaceAll(` ${attr}=`, ` ${attr.toLowerCase()}=`)
  }
  return html
}
