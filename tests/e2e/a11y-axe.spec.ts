import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Regras da WCAG 2.0, 2.1 e 2.2 nível A e AA, mais as boas práticas do axe. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

const LOCALES = [
  { locale: 'pt-BR', resume: '/', projects: '/projetos/' },
  { locale: 'en-US', resume: '/en/', projects: '/en/projects/' },
] as const

const SCHEMES = ['dark', 'light'] as const

/** Roda o axe com todas as regras e falha listando as violações de forma legível. */
const expectNoViolations = async (page: Page, context: string) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const summary = results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
  expect(summary, context).toEqual([])
}

/** A animação de troca de tema faria o axe medir cores no meio do caminho. */
const freezeTransitions = (page: Page) => page.addStyleTag({ content: '*{transition:none!important}' })

for (const { locale, resume, projects } of LOCALES) {
  for (const scheme of SCHEMES) {
    test.describe(`axe completo, ${locale}, tema ${scheme}`, () => {
      test.use({ locale, colorScheme: scheme })

      test('currículo', async ({ page }) => {
        await page.goto(resume)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        await freezeTransitions(page)
        await expectNoViolations(page, 'currículo')
      })

      test('todas as partes de todos os projetos', async ({ page }) => {
        await page.goto(projects)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        await freezeTransitions(page)
        const panelIds = await page.locator('[data-areas-nav] a').evaluateAll((links) =>
          links.map((link) => (link.getAttribute('href') ?? '').slice(1)),
        )
        expect(panelIds.length).toBeGreaterThan(10)
        for (const id of panelIds) {
          await page.goto(`${projects}#${id}`)
          await expect(page.locator(`#${id}`)).toBeVisible()
          await expectNoViolations(page, `parte ${id}`)
        }
      })
    })
  }
}
