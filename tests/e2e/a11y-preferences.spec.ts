import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PAGES = [
  { path: '/', locale: 'pt-BR' },
  { path: '/en/', locale: 'en-US' },
  { path: '/projetos/', locale: 'pt-BR' },
  { path: '/en/projects/', locale: 'en-US' },
]

const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

/** Espaçamento de texto da WCAG 1.4.12: o conteúdo não pode ser cortado nem sobrepor outro. */
const TEXT_SPACING_CSS = `* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }`

for (const { path, locale } of PAGES) {
  test.describe(`preferências do usuário em ${path}`, () => {
    test.use({ locale })

    test('reflow em 320px (equivale a 400% de zoom): sem rolagem horizontal', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
      await page.goto(path)
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    })

    test('com o espaçamento de texto da WCAG 1.4.12 nada estoura a largura e o axe continua limpo', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 })
      await page.goto(path)
      await page.addStyleTag({ content: TEXT_SPACING_CSS })
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })

    test('controles têm pelo menos 24 × 24 px (WCAG 2.5.8)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(path)
      const tooSmall = await page.evaluate(() =>
        [...document.querySelectorAll('a[href], button')]
          .filter((element) => element.getClientRects().length > 0 && !element.closest('.sr-only'))
          .filter((element) => !(element.parentElement?.tagName === 'P' || element.closest('p, li > a:only-child')?.tagName === 'P'))
          .map((element) => ({ name: (element.textContent ?? '').trim().slice(0, 40), box: element.getBoundingClientRect() }))
          .filter(({ box }) => box.width < 24 || box.height < 24)
          .map(({ name, box }) => `${name} ${Math.round(box.width)}×${Math.round(box.height)}`),
      )
      expect(tooSmall).toEqual([])
    })

    test('com "reduzir movimento" não há rolagem suave nem transições', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      const motion = await page.evaluate(() => ({
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        longestTransition: Math.max(
          ...[...document.querySelectorAll('a, button')].map((element) => {
            const durations = getComputedStyle(element).transitionDuration.split(',').map((value) => Number.parseFloat(value))
            return Math.max(...durations)
          }),
        ),
      }))
      expect(motion.scrollBehavior).toBe('auto')
      expect(motion.longestTransition).toBeLessThan(0.05)
    })

    test('com contraste maior pedido, filetes e textos secundários ganham contraste', async ({ page }) => {
      await page.emulateMedia({ contrast: 'more' })
      await page.goto(path)
      const colors = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement)
        return { muted: style.getPropertyValue('--c-ink-muted').trim(), ink: style.getPropertyValue('--c-ink').trim() }
      })
      expect(colors.muted).toBe(colors.ink)
    })

    test('em cores forçadas o item atual tem uma marca além da cor', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' })
      await page.goto(path)
      const current = page.locator('[aria-current]:visible').first()
      await expect(current).toBeVisible()
      expect(await current.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
    })
  })
}
