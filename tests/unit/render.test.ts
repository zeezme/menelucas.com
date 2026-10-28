import { describe, expect, it } from 'vitest'
import { resume, ui } from '../../src/content'
import { detectLocale, firstSentence, formatYearMonth, localePath } from '../../src/i18n'
import { renderPage } from '../../src/render'
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

describe('página renderizada', () => {
  it.each(['pt', 'en'] as const)('%s: semântica, SEO e links', (locale) => {
    const out = html(locale)
    expect(out.startsWith('<!doctype html>')).toBe(true)
    expect(out.match(/<h1[ >]/g)).toHaveLength(1)
    expect(out).toContain('<main id="content"')
    expect(out).toContain('href="#content"')
    expect(out).toContain('rel="canonical"')
    // React serializa como hrefLang; atributos HTML não diferenciam maiúsculas.
    expect(out).toMatch(/hreflang="pt"/i)
    expect(out).toMatch(/hreflang="en"/i)
    expect(out).toMatch(/hreflang="x-default"/i)
    expect(out).toContain('content="https://menelucas.com/banner.jpg"')
    expect(out).toContain('name="twitter:card" content="summary_large_image"')
    expect(out).toContain('name="theme-color" content="#010102"')
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
