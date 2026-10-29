import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator, pagePath, type PageId } from './internationalization'
import { ProjectsPage } from './pages/ProjectsPage'
import { ResumePage } from './pages/ResumePage'
import type { InterfaceTexts, Locale, Resume } from './schema/resume'
import { buildHeadMeta, openGraphLocale } from './seo/head'
import { redirectScript } from './seo/redirect-script'
import { THEME_COLORS, themeScript } from './seo/theme-script'
import { isIndexable, OPEN_GRAPH_IMAGE, type SiteConfig } from './site'

/** Tudo o que a geração de uma página precisa. */
interface RenderInput {
  resume: Resume
  interfaceTexts: InterfaceTexts
  locale: Locale
  site: SiteConfig
  /** Qual página renderizar (padrão: currículo). */
  page?: PageId
  /** CSS já compilado, embutido na página (sem requisição extra). */
  css: string
}

/** Documento HTML completo: `<head>` com SEO, scripts inline e CSS, e o corpo da página escolhida. */
const HtmlDocument = ({ resume, interfaceTexts, locale, site, css, page = 'resume' }: RenderInput) => {
  const meta = buildHeadMeta(resume, locale, site, page, createTranslator(interfaceTexts, locale)('projects'))
  const otherLocale: Locale = locale === 'pt' ? 'en' : 'pt'
  return (
    <html
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
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
        {meta.alternates.map((alternate) => (
          <link key={alternate.locale} rel="alternate" hrefLang={alternate.locale} href={alternate.href} />
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
        <meta property="og:locale" content={openGraphLocale(locale)} />
        <meta property="og:locale:alternate" content={openGraphLocale(otherLocale)} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:image:secure_url" content={meta.image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content={String(OPEN_GRAPH_IMAGE.width)} />
        <meta property="og:image:height" content={String(OPEN_GRAPH_IMAGE.height)} />
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
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(meta.jsonLd).replace(/</g, '\u003c') }}
          />
      </head>
      <body>
        {page === 'resume' ? (
          <ResumePage resume={resume} interfaceTexts={interfaceTexts} locale={locale} base={site.base} />
        ) : (
          <ProjectsPage resume={resume} interfaceTexts={interfaceTexts} locale={locale} base={site.base} />
        )}
      </body>
    </html>
  )
}

/** React serializa alguns atributos em camelCase; scrapers simples, como o do WhatsApp, esperam minúsculas. */
const CAMEL_CASE_ATTRIBUTES = ['charSet', 'hrefLang', 'fetchPriority', 'crossOrigin', 'tabIndex', 'dateTime'] as const

/** Gera o HTML estático de uma página. */
export const renderPage = (input: RenderInput): string => {
  let html = `<!doctype html>${renderToStaticMarkup(<HtmlDocument {...input} />)}`
  for (const attribute of CAMEL_CASE_ATTRIBUTES) {
    html = html.replaceAll(` ${attribute}=`, ` ${attribute.toLowerCase()}=`)
  }
  return html
}
