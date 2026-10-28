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
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#010102')
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
      await expect(page.locator('a[href="https://github.com/Zeezme"]')).toHaveAttribute('aria-label', /GitHub/)
      await expect(page.locator('a[href="https://www.linkedin.com/in/meneluca"]')).toHaveAttribute('aria-label', /LinkedIn/)
      await expect(page.locator('a[href^="https://wa.me/5511961750560"]')).toHaveCount(1)
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://menelucas.com/banner.jpg')
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
      const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
      expect(ld['@type']).toBe('Person')
      expect(ld.telephone).toBeUndefined()
    })

    test('sem violações de acessibilidade (axe)', async ({ page }) => {
      await page.goto(p.path)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })

    for (const width of [375, 768, 1440, 2560]) {
      test(`sem scroll horizontal em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(p.path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }

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

test('impressão usa fundo branco', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).toMatch(/rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)/)
})
