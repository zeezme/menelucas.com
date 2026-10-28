import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PROJECT_PAGES = [
  {
    path: '/projetos/',
    locale: 'pt-BR',
    lang: 'pt-BR',
    h1: 'Projetos',
    other: '/en/projects/',
    tabs: ['Currículo', 'Projetos'],
    sections: ['Qualidade e entrega', 'Segurança e controle de acesso', 'Privacidade e LGPD', 'Regras do CFM e dos conselhos (CRM)', 'Infraestrutura na AWS', 'Telas'],
    note: 'dados fictícios',
    switchTo: 'EN',
  },
  {
    path: '/en/projects/',
    locale: 'en-US',
    lang: 'en',
    h1: 'Projects',
    other: '/projetos/',
    tabs: ['Resume', 'Projects'],
    sections: ['Quality and delivery', 'Security and access control', 'Privacy and LGPD', 'CFM and professional-council rules (CRM)', 'AWS infrastructure', 'Screens'],
    note: 'fictitious data',
    switchTo: 'PT',
  },
]

for (const pp of PROJECT_PAGES) {
  test.describe(`página ${pp.path}`, () => {
    test.use({ locale: pp.locale })

    test('estrutura: h1, abas, seções, nota e galeria', async ({ page }) => {
      await page.goto(pp.path)
      await expect(page.locator('html')).toHaveAttribute('lang', pp.lang)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(pp.h1)
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('iPsiq')
      await expect(page.getByRole('heading', { level: 3 })).toHaveText(pp.sections)
      const tabs = page.getByRole('navigation', { name: /Seções do site|Site sections/ })
      await expect(tabs.getByRole('link')).toHaveText(pp.tabs)
      await expect(tabs.getByRole('link', { name: pp.tabs[1] ?? '' })).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('complementary')).toContainText('LGPD')
      await expect(page.getByRole('complementary')).toContainText('CFM')
      await expect(page.getByText(pp.note)).toBeVisible()
      await expect(page.locator('figure')).toHaveCount(9)
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
    })

    test('todas as imagens carregam, com alt', async ({ page }) => {
      await page.goto(pp.path)
      const imgs = page.locator('figure img')
      const count = await imgs.count()
      expect(count).toBe(9)
      for (let i = 0; i < count; i++) {
        const img = imgs.nth(i)
        await img.scrollIntoViewIfNeeded()
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { message: `imagem ${i}` })
          .toBe(true)
        expect(((await img.getAttribute('alt')) ?? '').length).toBeGreaterThan(10)
      }
    })

    test('índice "Nesta página" leva às seções', async ({ page }) => {
      await page.goto(pp.path)
      const index = page.getByRole('navigation', { name: /Nesta página|On this page/ })
      await expect(index.getByRole('link')).toHaveCount(6)
      await index.getByRole('link').nth(3).click()
      await expect(page).toHaveURL(/#ipsiq-/)
      await expect(page.getByRole('heading', { level: 3, name: pp.sections[3] ?? '' })).toBeInViewport()
    })

    for (const width of [375, 768, 1440]) {
      test(`sem overflow horizontal em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(pp.path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }

    for (const scheme of ['dark', 'light'] as const) {
      test(`sem violações de acessibilidade (axe), tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(pp.path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
      })
    }

    test('troca de idioma leva para a mesma página no outro idioma', async ({ page }) => {
      await page.goto(pp.path)
      await page
        .getByRole('navigation', { name: /Idioma|Language/ })
        .getByRole('link', { name: new RegExp(`^${pp.switchTo}`) })
        .click()
      await expect(page).toHaveURL(new RegExp(`${pp.other.replace(/\//g, '\\/')}$`))
    })
  })
}

test.describe('abas e rotas', () => {
  test.use({ locale: 'pt-BR' })

  test('aba Projetos no currículo leva à página e a aba Currículo volta', async ({ page }) => {
    await page.goto('/')
    const tabs = page.getByRole('navigation', { name: 'Seções do site' })
    await tabs.getByRole('link', { name: 'Projetos' }).click()
    await expect(page).toHaveURL(/\/projetos\/$/)
    await tabs.getByRole('link', { name: 'Currículo' }).click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)
  })
})

test.describe('navegador em inglês', () => {
  test.use({ locale: 'en-US' })

  test('a página PT de projetos redireciona para a versão EN na primeira visita', async ({ page }) => {
    await page.goto('/projetos/')
    await expect(page).toHaveURL(/\/en\/projects\/$/)
  })
})

test('sitemap inclui as páginas de projetos', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://menelucas.com/projetos/</loc>')
  expect(sitemap).toContain('<loc>https://menelucas.com/en/projects/</loc>')
})
