import { describe, expect, it } from 'vitest'
import { resume, ui } from '../../src/content'
import { detectLocale, firstSentence, formatYearMonth, localePath } from '../../src/i18n'
import { renderPage } from '../../src/render'
import { buildHeadMeta, buildRobots, buildSitemap, skillKeywords } from '../../src/seo/head'
import { siteConfig } from '../../src/site'

const site = siteConfig({})
const html = (locale: 'pt' | 'en') => renderPage({ resume, ui, locale, site, css: '' })

describe('i18n helpers', () => {
  it('detecta pt* como PT e o resto como EN', () => {
    expect(detectLocale(['pt-BR', 'en'])).toBe('pt')
    expect(detectLocale(['pt-PT'])).toBe('pt')
    expect(detectLocale(['en-US', 'pt-BR'])).toBe('en')
    expect(detectLocale(['es'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })

  it('formata datas e caminhos', () => {
    expect(formatYearMonth('2026-02', 'pt')).toBe('02/2026')
    expect(formatYearMonth('2024-12', 'en')).toBe('12/2024')
    expect(localePath('pt', '/')).toBe('/')
    expect(localePath('en', '/staging/')).toBe('/staging/en/')
    expect(firstSentence('Primeira frase. Segunda frase.')).toBe('Primeira frase.')
  })
})

describe('SEO para recrutadores', () => {
  it.each(['pt', 'en'] as const)('%s: título, descrição e palavras-chave derivados dos dados', (locale) => {
    const meta = buildHeadMeta(resume, locale, site)
    expect(meta.title).toContain('Lucas Augusto Muniz Menezes')
    expect(meta.title).toMatch(/TypeScript, Node\.js/)
    expect(meta.description).toMatch(/TypeScript, Node\.js, NestJS e React|TypeScript, Node\.js, NestJS and React/)
    for (const k of ['TypeScript', 'Node.js', 'NestJS', 'React', 'PostgreSQL', 'KYC', 'AML']) {
      expect(meta.keywords).toContain(k)
    }
  })

  it('JSON-LD: Person com tecnologias, idiomas e formação, ligado a um ProfilePage', () => {
    const { jsonLd } = buildHeadMeta(resume, 'en', site)
    const graph = (jsonLd as { '@graph': Record<string, unknown>[] })['@graph']
    const person = graph.find((n) => n['@type'] === 'Person')
    const profile = graph.find((n) => n['@type'] === 'ProfilePage')
    expect(person?.['alternateName']).toContain('Lucas Menezes')
    expect(person?.['knowsAbout']).toEqual(skillKeywords(resume, 'en'))
    expect(person?.['knowsLanguage']).toEqual(['pt', 'en', 'es'])
    expect(person?.['telephone']).toBeUndefined()
    expect(profile?.['mainEntity']).toEqual({ '@id': person?.['@id'] })
  })

  it('sitemap lista PT e EN com hreflang; robots aponta para o sitemap', () => {
    const xml = buildSitemap(site, new Date('2026-10-28T12:00:00Z'))
    expect(xml).toContain('<loc>https://menelucas.com/</loc>')
    expect(xml).toContain('<loc>https://menelucas.com/en/</loc>')
    expect(xml).toContain('<lastmod>2026-10-28</lastmod>')
    expect(buildRobots(site)).toContain('Sitemap: https://menelucas.com/sitemap.xml')
  })

  it('staging recebe noindex; produção é indexável', () => {
    const staged = renderPage({ resume, ui, locale: 'pt', site: siteConfig({ BASE_PATH: '/staging/' }), css: '' })
    expect(staged).toContain('content="noindex, nofollow"')
    expect(html('pt')).toContain('content="index, follow, max-image-preview:large"')
  })
})

describe('página renderizada', () => {
  it.each(['pt', 'en'] as const)('%s: semântica, SEO e links', (locale) => {
    const out = html(locale)
    expect(out.startsWith('<!doctype html>')).toBe(true)
    expect(out.match(/<h1[ >]/g)).toHaveLength(1)
    expect(out).toContain('<main id="content"')
    expect(out).toContain('href="#content"')
    expect(out).toContain('rel="canonical"')
    expect(out).toContain('hreflang="pt"')
    expect(out).toContain('hreflang="en"')
    expect(out).toContain('hreflang="x-default"')
    expect(out).toContain('<meta charset="utf-8"/>')
    expect(out).not.toMatch(/ (charSet|hrefLang|fetchPriority|crossOrigin|tabIndex|dateTime)=/)
    expect(out).toContain('content="https://menelucas.com/banner.jpg"')
    const versioned = renderPage({ resume, ui, locale, site: { ...site, ogVersion: 'abc12345' }, css: '' })
    expect(versioned).toContain('content="https://menelucas.com/banner-abc12345.jpg"')
    expect(out).toContain('property="og:image:secure_url" content="https://menelucas.com/banner.jpg"')
    expect(out).toContain('property="og:image:type" content="image/jpeg"')
    expect(out).toContain('name="twitter:card" content="summary_large_image"')
    expect(out).toContain('name="theme-color" content="#010102" media="(prefers-color-scheme: dark)"')
    expect(out).toContain('name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"')
    expect(out).toContain('data-theme-toggle')
    expect(out).toContain('application/ld+json')
    expect(out).toContain(`href="${resume.meta.pdf[locale]}"`)
  })

  it('PT só redireciona a partir da página PT', () => {
    expect(html('pt')).toMatch(/<html[^>]*data-en-url="\/en\/"/)
    expect(html('en')).not.toMatch(/<html[^>]*data-en-url/)
  })

  it('não imprime o telefone em texto; contato por WhatsApp e mailto', () => {
    const out = html('pt')
    expect(out).not.toContain('96175-0560')
    expect(out).not.toContain('(11)')
    expect(out).toContain('mailto:lukascass@gmail.com')
  })

  it('respeita BASE_PATH nos links de idioma e ativos', () => {
    const staged = renderPage({ resume, ui, locale: 'pt', site: siteConfig({ BASE_PATH: 'staging' }), css: '' })
    expect(staged).toContain('href="/staging/en/"')
    expect(staged).toContain('src="/staging/avatar.webp"')
  })
})
