import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PROJECTS = [
  { slug: 'ipsiq', title: 'iPsiq' },
  { slug: 'clinica', title: 'Luhmera' },
]

// O axe percorre dezenas de partes por teste; com a máquina cheia o limite padrão de 30 s é apertado.
test.describe.configure({ timeout: 120_000 })

const LOCALES = [
  { locale: 'pt-BR', projects: '/projetos/', resume: '/', otherProjects: '/en/projects/', switchTo: 'EN' },
  { locale: 'en-US', projects: '/en/projects/', resume: '/en/', otherProjects: '/projetos/', switchTo: 'PT' },
] as const

const panelIds = (page: Page) =>
  page.locator('[data-areas-nav] a').evaluateAll((links) => links.map((link) => (link.getAttribute('href') ?? '').slice(1)))

for (const { locale, projects, resume, otherProjects, switchTo } of LOCALES) {
  for (const { slug, title } of PROJECTS) {
    test.describe(`página própria de ${title} em ${projects}${slug}/`, () => {
      test.use({ locale })
      const path = `${projects}${slug}/`

      test('abre, tem um h1 com o título, o caminho de volta e só o projeto dela', async ({ page }) => {
        const response = await page.goto(path)
        expect(response?.status()).toBe(200)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
        await expect(page.locator('article')).toHaveCount(1)
        const breadcrumb = page.getByRole('navigation', { name: /Você está em|You are here/ })
        await expect(breadcrumb.getByRole('link')).toHaveAttribute('href', projects)
        await expect(page).toHaveTitle(new RegExp(`^${title} \\| `))
      })

      test('as partes funcionam pela barra lateral e pelo endereço com #, como na página de projetos', async ({ page }) => {
        await page.goto(path)
        const ids = await panelIds(page)
        expect(ids.length).toBeGreaterThan(5)
        const links = page.locator('[data-areas-nav] a')
        await links.nth(2).click()
        await expect(page).toHaveURL(new RegExp(`#${ids[2]}$`))
        await expect(page.locator(`#${ids[2]}`)).toBeVisible()
        await expect(page.locator(`#${ids[0]}`)).toBeHidden()
        await page.goto(`${path}#${ids[3]}`)
        await expect(page.locator(`#${ids[3]}`)).toBeVisible()
      })

      test('o idioma leva à mesma página do projeto no outro idioma, mantendo a parte aberta', async ({ page }) => {
        await page.goto(path)
        const ids = await panelIds(page)
        await page.goto(`${path}#${ids[2]}`)
        await page.getByRole('navigation', { name: /Idioma|Language/ }).getByRole('link', { name: new RegExp(`^${switchTo}`) }).click()
        await expect(page).toHaveURL(new RegExp(`${otherProjects.replace(/\//g, '\\/')}${slug}\\/#${ids[2]}$`))
        await expect(page.locator(`#${ids[2]}`)).toBeVisible()
      })

      test('a aba Projetos continua marcada e leva à lista', async ({ page }) => {
        await page.goto(path)
        const tabs = page.getByRole('navigation', { name: /Seções do site|Site sections/ })
        await expect(tabs.getByRole('link', { name: /Projetos|Projects/ })).toHaveAttribute('aria-current', 'true')
        await tabs.getByRole('link', { name: /Projetos|Projects/ }).click()
        await expect(page).toHaveURL(new RegExp(`${projects}$`))
      })

      test('os títulos não pulam nível e não há rolagem horizontal em 320 px e 1440 px', async ({ page }) => {
        for (const width of [320, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await page.goto(path)
          for (const id of await panelIds(page)) {
            await page.goto(`${path}#${id}`)
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
            expect(overflow, `${id} em ${width}px`).toBeLessThanOrEqual(0)
          }
        }
        const levels = await page.evaluate(() =>
          [...document.querySelectorAll('h1, h2, h3, h4')].filter((heading) => heading.getClientRects().length > 0).map((heading) => Number(heading.tagName.slice(1))),
        )
        expect(levels.filter((level) => level === 1)).toHaveLength(1)
        levels.forEach((level, index) => {
          if (index > 0) expect(level - (levels[index - 1] ?? 0), levels.join(',')).toBeLessThanOrEqual(1)
        })
      })

      for (const scheme of ['dark', 'light'] as const) {
        test(`todas as partes passam no axe com todas as regras WCAG, tema ${scheme}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: scheme })
          await page.goto(path)
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
          await page.addStyleTag({ content: '*{transition:none!important}' })
          for (const id of await panelIds(page)) {
            await page.goto(`${path}#${id}`)
            await expect(page.locator(`#${id}`)).toBeVisible()
            const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
            expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`), id).toEqual([])
          }
        })
      }
    })
  }

  test.describe(`currículo e lista em ${resume}`, () => {
    test.use({ locale })

    test('os cards do currículo levam às páginas próprias e a lista de projetos é o menu para elas', async ({ page }) => {
      await page.goto(resume)
      const links = page.locator('section[aria-labelledby="projects-title"] article a')
      await expect(links).toHaveCount(PROJECTS.length)
      for (const [index, { slug }] of PROJECTS.entries()) await expect(links.nth(index)).toHaveAttribute('href', `${projects}${slug}/`)
      await page.goto(projects)
      await expect(page.getByRole('navigation', { name: /Menu de projetos|Projects menu/ }).getByRole('link')).toHaveCount(PROJECTS.length)
    })

    test('o sitemap lista as páginas dos projetos e o primeiro acesso de quem usa inglês é levado à versão em inglês', async ({ page, request }) => {
      const sitemap = await (await request.get('/sitemap.xml')).text()
      for (const { slug } of PROJECTS) {
        expect(sitemap).toContain(`<loc>https://menelucas.com/projetos/${slug}/</loc>`)
        expect(sitemap).toContain(`<loc>https://menelucas.com/en/projects/${slug}/</loc>`)
      }
      if (locale === 'en-US') {
        await page.goto('/projetos/ipsiq/')
        await expect(page).toHaveURL(/\/en\/projects\/ipsiq\/$/)
      }
    })
  })
}
