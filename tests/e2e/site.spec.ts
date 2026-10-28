import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', lang: 'pt-BR', h2: ['Resumo', 'Competências', 'Experiência', 'Formação', 'Idiomas'], pdf: '/cv.pdf', cta: 'Baixar PDF' },
  { path: '/en/', lang: 'en', h2: ['Summary', 'Skills', 'Experience', 'Education', 'Languages'], pdf: '/cv-en.pdf', cta: 'Download PDF' },
]

for (const p of PAGES) {
  test.describe(p.path, () => {
    // Fixa o idioma do navegador igual ao da página para a detecção não interferir.
    test.use({ locale: p.lang === 'en' ? 'en-US' : 'pt-BR' })

    test('estrutura semântica e conteúdo', async ({ page }) => {
      await page.goto(p.path)
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lucas Augusto Muniz Menezes')
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(p.h2)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#010102')
    })

    test('botão de PDF aponta para o PDF do idioma e ele existe', async ({ page, request }) => {
      await page.goto(p.path)
      await expect(page.getByRole('link', { name: p.cta })).toHaveAttribute('href', p.pdf)
      const res = await request.get(p.pdf)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('pdf')
    })

    test('links externos e metadados sociais', async ({ page }) => {
      await page.goto(p.path)
      await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Zeezme')
      await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/meneluca')
      await expect(page.getByRole('link', { name: /e-?mail/i })).toHaveAttribute('href', 'mailto:lukascass@gmail.com')
      await expect(page.locator('a[href^="https://wa.me/5511961750560"]')).toHaveCount(1)
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/menelucas\.com\/banner-[0-9a-f]{8}\.jpg$/)
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
      const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
      const person = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person')
      expect(person.name).toBe('Lucas Augusto Muniz Menezes')
      expect(person.knowsAbout).toEqual(expect.arrayContaining(['TypeScript', 'Node.js', 'React']))
      expect(person.telephone).toBeUndefined()
      expect(ld['@graph'].some((n: { '@type': string }) => n['@type'] === 'ProfilePage')).toBe(true)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/)
    })

    for (const scheme of ['dark', 'light'] as const) {
      test(`sem violações de acessibilidade (axe), tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(p.path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
      })
    }

    for (const width of [375, 768, 1440, 2560]) {
      test(`sem scroll horizontal em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(p.path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }

    test('mobile mostra os nomes das redes ao lado dos ícones', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(p.path)
      for (const name of ['LinkedIn', 'GitHub', 'WhatsApp']) {
        await expect(page.getByRole('link', { name }).getByText(name)).toBeVisible()
      }
    })

    test('desktop mostra só os ícones das redes', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(p.path)
      // sr-only: continua no DOM (nome acessível), mas ocupa 1px.
      const box = await page.getByRole('link', { name: 'GitHub' }).getByText('GitHub').boundingBox()
      expect(box?.width ?? 0).toBeLessThanOrEqual(1)
    })

    test('alvos de toque do cabeçalho têm tamanho mínimo no mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(p.path)
      const targets = page.locator('header a')
      const count = await targets.count()
      for (let i = 0; i < count; i++) {
        const box = await targets.nth(i).boundingBox()
        expect(box?.height ?? 0, `alvo ${i}`).toBeGreaterThanOrEqual(36)
        expect(box?.width ?? 0, `alvo ${i}`).toBeGreaterThanOrEqual(44)
      }
    })

    test('skip link é o primeiro foco e fica visível', async ({ page }) => {
      await page.goto(p.path)
      await page.keyboard.press('Tab')
      const skip = page.locator('a[href="#content"]')
      await expect(skip).toBeFocused()
      await expect(skip).toBeVisible()
    })
  })
}

test('sitemap.xml e robots.txt', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://menelucas.com/</loc>')
  expect(sitemap).toContain('<loc>https://menelucas.com/en/</loc>')
  expect(sitemap).toContain('hreflang="x-default"')
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Sitemap: https://menelucas.com/sitemap.xml')
})

test.describe('detecção de idioma', () => {
  test.describe('navegador em inglês', () => {
    test.use({ locale: 'en-US' })

    test('redireciona / para /en/ na primeira visita', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/en\/$/)
    })

    test('botão PT lembra a escolha e não redireciona de volta', async ({ page }) => {
      await page.goto('/en/')
      await page.getByRole('link', { name: 'Portuguese' }).click()
      await expect(page).toHaveURL(/localhost:\d+\/$/)
      await page.reload()
      await expect(page).toHaveURL(/localhost:\d+\/$/)
      expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('pt')
    })
  })

  test.describe('navegador em português', () => {
    test.use({ locale: 'pt-BR' })

    test('permanece em / e depois respeita a escolha EN', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/localhost:\d+\/$/)
      await page.getByRole('link', { name: 'Inglês' }).click()
      await expect(page).toHaveURL(/\/en\/$/)
      await page.goto('/')
      await expect(page).toHaveURL(/\/en\/$/)
    })
  })

  test('funciona com localStorage indisponível', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('bloqueado')
        },
      })
    })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(/\/en\/$/)
    await context.close()
  })
})

test.describe('tema claro/escuro', () => {
  const bg = (page: import('@playwright/test').Page) =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const themeColor = (page: import('@playwright/test').Page) =>
    page.locator('meta[name="theme-color"]').first().getAttribute('content')

  test('segue o tema do sistema', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await bg(page)).toBe('rgb(255, 255, 255)')
    expect(await themeColor(page)).toBe('#ffffff')

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await bg(page)).toBe('rgb(1, 1, 2)')
    expect(await themeColor(page)).toBe('#010102')
  })

  test('botão alterna, lembra a escolha e ela vence o sistema', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /tema|theme/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  })

  test('funciona com localStorage indisponível', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' })
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('bloqueado')
        },
      })
    })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: /tema|theme/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await context.close()
  })
})

test('impressão usa fundo branco', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).toMatch(/rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)/)
})
