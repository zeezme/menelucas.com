import { describe, expect, it } from 'vitest'
import { interfaceTexts, resume } from '../../src/content'
import { detectLocale, firstSentence, formatYearMonth, localePath } from '../../src/internationalization'
import { renderPage } from '../../src/render'
import { buildHeadMeta, buildRobots, buildSitemap, skillKeywords } from '../../src/seo/head'
import { siteConfig } from '../../src/site'

const site = siteConfig({})
const showcase = (resume.projects ?? []).filter((p) => (p.areas?.length ?? 0) > 0)
const allAreas = showcase.flatMap((p) => p.areas ?? [])
const galleryItems = allAreas.flatMap((a) => a.gallery ?? [])
const html = (locale: 'pt' | 'en') => renderPage({ resume, interfaceTexts, locale, site, css: '' })

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
  it.each(['pt', 'en'] as const)('%s: título, descrição e palavras-chave vêm dos dados', (locale) => {
    const meta = buildHeadMeta(resume, locale, site)
    expect(meta.title).toBe(`${resume.basics.name} — ${resume.basics.label[locale].split(' | ')[0]}`)
    expect(meta.description.startsWith(`${resume.basics.name}:`)).toBe(true)
    expect(meta.description.length).toBeGreaterThan(50)
    for (const k of skillKeywords(resume, locale).slice(0, 5)) expect(meta.keywords).toContain(k)
  })

  it('os perfis públicos viram sameAs, <link rel="me"> e nomes alternativos (o usuário de cada rede)', () => {
    const publicProfiles = resume.basics.profiles.filter((profile) => profile.network !== 'WhatsApp')
    for (const locale of ['pt', 'en'] as const) {
      const meta = buildHeadMeta(resume, locale, site)
      const person = (meta.jsonLd as { '@graph': Record<string, unknown>[] })['@graph'].find((node) => node['@type'] === 'Person')
      expect(person?.['sameAs']).toEqual(publicProfiles.map((profile) => profile.url))
      const handles = publicProfiles.map((profile) => new URL(profile.url).pathname.split('/').filter(Boolean).pop())
      for (const handle of handles) expect(person?.['alternateName']).toContain(handle)
      const out = html(locale)
      for (const profile of publicProfiles) expect(out).toContain(`<link rel="me" href="${profile.url}"/>`)
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
    const xml = buildSitemap(site, ['resume', 'projects'], new Date('2026-10-28T12:00:00Z'))
    expect(xml).toContain('<loc>https://menelucas.com/</loc>')
    expect(xml).toContain('<loc>https://menelucas.com/en/</loc>')
    expect(xml).toContain('<loc>https://menelucas.com/projetos/</loc>')
    expect(xml).toContain('<loc>https://menelucas.com/en/projects/</loc>')
    expect(buildSitemap(site, ['resume']).match(/<loc>/g)).toHaveLength(2)
    expect(xml).toContain('<lastmod>2026-10-28</lastmod>')
    expect(buildRobots(site)).toContain('Sitemap: https://menelucas.com/sitemap.xml')
  })

  it('staging recebe noindex; produção é indexável', () => {
    const staged = renderPage({ resume, interfaceTexts, locale: 'pt', site: siteConfig({ BASE_PATH: '/staging/' }), css: '' })
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
    expect(out).toContain(`content="https://menelucas.com/banner-${locale}.jpg"`)
    const versioned = renderPage({ resume, interfaceTexts, locale, site: { ...site, openGraphVersions: { [locale]: 'abc12345' } }, css: '' })
    expect(versioned).toContain(`content="https://menelucas.com/banner-${locale}-abc12345.jpg"`)
    expect(out).toContain(`property="og:image:secure_url" content="https://menelucas.com/banner-${locale}.jpg"`)
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
    const staged = renderPage({ resume, interfaceTexts, locale: 'pt', site: siteConfig({ BASE_PATH: 'staging' }), css: '' })
    expect(staged).toContain('href="/staging/en/"')
    expect(staged).toContain('src="/staging/avatar.webp"')
  })
})

describe('seção Projetos', () => {
  const sectionOf = (out: string) => /<section aria-labelledby="projects-title".*?<\/section>/s.exec(out)?.[0] ?? ''

  it.each(['pt', 'en'] as const)('%s: a seção aparece entre Experiência e Formação, com a data e o link para a página de Projetos', (locale) => {
    const out = html(locale)
    const section = sectionOf(out)
    const project = resume.projects?.[0]
    expect(section).toContain(project?.name ?? '')
    expect(section).toContain(`<time datetime="${project?.startDate}">`)
    expect(section).toContain(locale === 'pt' ? 'href="/projetos/"' : 'href="/en/projects/"')
    const order = ['experience-title', 'projects-title', 'education-title'].map((id) => out.indexOf(`id="${id}"`))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every((i) => i > 0)).toBe(true)
  })

  it('sem projects (ou vazio) a seção não existe', () => {
    const without = structuredClone(resume)
    delete without.projects
    for (const locale of ['pt', 'en'] as const) {
      expect(sectionOf(renderPage({ resume: without, interfaceTexts, locale, site, css: '' }))).toBe('')
      expect(sectionOf(renderPage({ resume: { ...without, projects: [] }, interfaceTexts, locale, site, css: '' }))).toBe('')
    }
  })
})

describe('página Projetos', () => {
  const projectsHtml = (locale: 'pt' | 'en', r = resume) => renderPage({ resume: r, interfaceTexts, locale, site, css: '', page: 'projects' })

  it.each([
    ['pt', 'Projetos', 'Currículo'],
    ['en', 'Projects', 'Resume'],
  ] as const)('%s: h1, abas e imagens acessíveis', (locale, title, tab) => {
    const out = projectsHtml(locale)
    expect(out.match(/<h1[ >]/g)).toHaveLength(1)
    expect(out).toContain(`>${title}</h1>`)
    expect(out).toContain('aria-current="page"')
    expect(out).toContain(`>${tab}</a>`)
    const imgs = out.match(/<img [^>]*>/g) ?? []
    expect(imgs).toHaveLength(galleryItems.length)
    for (const img of imgs) {
      expect(img).toMatch(/ alt="[^"]{10,}"/)
      expect(img).toMatch(/ width="\d+"/)
      expect(img).toMatch(/ height="\d+"/)
      expect(img).toContain('loading="lazy"')
      expect(img).toMatch(/src="\/projetos\/[a-z]+\/[a-z0-9-]+\.webp"/)
    }
  })

  it.each(['pt', 'en'] as const)('%s: barra lateral com as partes do sistema, cada uma com seu painel', (locale) => {
    const out = projectsHtml(locale)
    const h3 = [...out.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map((m) => m[1])
    expect(h3).toHaveLength(allAreas.length + showcase.length)
    const navs = [...out.matchAll(/<nav[^>]*data-areas-nav[^>]*>.*?<\/nav>/gs)].map((m) => m[0])
    expect(navs).toHaveLength(showcase.length)
    const links = navs.flatMap((nav) => [...nav.matchAll(/<a href="#([a-z0-9-]+)"[^>]*>(.*?)<\/a>/g)])
    expect(links.map((m) => m[2])).toEqual(h3)
    for (const m of links) expect(out).toContain(`<section id="${m[1]}"`)
  })

  it.each(['pt', 'en'] as const)('%s: visão geral com as seções temáticas e a nota', (locale) => {
    const out = projectsHtml(locale)
    const h4 = [...out.matchAll(/<h4[^>]*>(.*?)<\/h4>/g)].map((m) => m[1])
    expect(h4).toHaveLength(showcase.flatMap((p) => p.detailSections ?? []).length)
    const asides = out.match(/<aside[ >]/g) ?? []
    expect(asides).toHaveLength(showcase.filter((p) => p.notice).length)
  })

  it.each(['pt', 'en'] as const)('%s: blocos de código rolam com teclado e cada diagrama vira uma lista ordenada', (locale) => {
    const out = projectsHtml(locale)
    const snippets = allAreas.flatMap((a) => a.snippets ?? []).length
    const diagrams = allAreas.flatMap((a) => a.diagrams ?? []).length + showcase.flatMap((p) => p.diagrams ?? []).length
    expect(out.match(/<pre[ >]/g) ?? []).toHaveLength(snippets)
    expect(out.match(/<pre tabindex="0"/g) ?? []).toHaveLength(snippets)
    expect(out.match(/<figure[^>]*><div[^>]*><p[^>]*>[^<]*<\/p><ol/g) ?? []).toHaveLength(diagrams)
  })

  it('tem hreflang, canonical próprio e redireciona PT→EN só na versão PT', () => {
    const pt = projectsHtml('pt')
    expect(pt).toContain('<link rel="canonical" href="https://menelucas.com/projetos/"/>')
    expect(pt).toContain('hreflang="en" href="https://menelucas.com/en/projects/"')
    expect(pt).toMatch(/<html[^>]*data-en-url="\/en\/projects\/"/)
    expect(projectsHtml('en')).not.toMatch(/<html[^>]*data-en-url/)
  })

  it('tem JSON-LD da pessoa no idioma da página', () => {
    for (const locale of ['pt', 'en'] as const) {
      const out = projectsHtml(locale)
      const json = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(out)?.[1] ?? ''
      const person = (JSON.parse(json) as { '@graph': { '@type': string; jobTitle: string }[] })['@graph'].find((n) => n['@type'] === 'Person')
      expect(person?.jobTitle).toBe(resume.basics.label[locale].split(' | ')[0])
    }
  })

  it('sem projeto com partes do sistema, a aba some do currículo', () => {
    const without = structuredClone(resume)
    delete without.projects
    for (const locale of ['pt', 'en'] as const) {
      expect(renderPage({ resume: without, interfaceTexts, locale, site, css: '' })).not.toContain(
        'aria-label="' + (locale === 'pt' ? 'Seções do site' : 'Site sections') + '"',
      )
    }
    const noAreas = structuredClone(resume)
    for (const p of noAreas.projects ?? []) delete p.areas
    expect(renderPage({ resume: noAreas, interfaceTexts, locale: 'pt', site, css: '' })).not.toContain('href="/projetos/"')
  })

  it('imagens de public/ existem', async () => {
    const { existsSync } = await import('node:fs')
    expect(galleryItems.length).toBeGreaterThan(0)
    for (const item of galleryItems) expect(existsSync(`public/${item.src}`), item.src).toBe(true)
  })
})

describe('projeto confidencial', () => {
  const secret = showcase.filter((p) => p.slug === 'clinica')

  it('existe e vem depois do primeiro projeto', () => {
    expect(secret.length).toBeGreaterThan(0)
    expect(showcase.indexOf(secret[0] as (typeof showcase)[number])).toBeGreaterThan(0)
  })

  it('o card no currículo leva à seção do projeto em /projetos/ e /en/projects/', () => {
    for (const [locale, base] of [['pt', '/projetos/'], ['en', '/en/projects/']] as const) {
      const out = html(locale)
      for (const p of secret) expect(out).toContain(`href="${base}#${p.slug}-overview"`)
    }
  })

  it('nada dele entra no JSON-LD', () => {
    const titles = secret.flatMap((p) => [p.name, p.title?.pt ?? '', p.title?.en ?? '', p.cardText?.pt ?? '', p.cardText?.en ?? ''].filter(Boolean))
    for (const page of ['resume', 'projects'] as const) {
      for (const locale of ['pt', 'en'] as const) {
        const meta = buildHeadMeta(resume, locale, site, page, 'Projetos')
        const ld = JSON.stringify(meta.jsonLd)
        for (const t of titles) expect(ld).not.toContain(t)
      }
    }
  })
})

describe('termos do projeto confidencial', () => {
  it('as páginas e o conteúdo só citam o nome do produto, e só como "Luhmera"', () => {
    const pages = (['pt', 'en'] as const).flatMap((locale) => [html(locale), renderPage({ resume, interfaceTexts, locale, site, css: '', page: 'projects' })])
    for (const text of [...pages, JSON.stringify(resume), JSON.stringify(interfaceTexts)]) {
      expect(text.replaceAll('Luhmera', '')).not.toMatch(/luhmera|LM Solutions/i)
    }
  })
})
