import { expect, test, type Page } from '@playwright/test'

const PAGES = [
  { path: '/', locale: 'pt-BR' },
  { path: '/en/', locale: 'en-US' },
  { path: '/projetos/', locale: 'pt-BR' },
  { path: '/en/projects/', locale: 'en-US' },
]

/** Níveis dos títulos na ordem do documento, ignorando o que está escondido. */
const headingLevels = (page: Page): Promise<number[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter((heading) => heading.getClientRects().length > 0)
      .map((heading) => Number(heading.tagName.slice(1))),
  )

for (const { path, locale } of PAGES) {
  test.describe(`semântica em ${path}`, () => {
    test.use({ locale })

    test('há um único h1 e os títulos nunca pulam um nível', async ({ page }) => {
      await page.goto(path)
      const levels = await headingLevels(page)
      expect(levels.filter((level) => level === 1)).toHaveLength(1)
      levels.forEach((level, index) => {
        if (index > 0) expect(level - (levels[index - 1] ?? 0), `títulos: ${levels.join(',')}`).toBeLessThanOrEqual(1)
      })
    })

    test('links diferentes não compartilham o mesmo nome acessível com destinos diferentes', async ({ page }) => {
      await page.goto(path)
      const links = await page.locator('a[href]:visible').evaluateAll((anchors) =>
        anchors.map((anchor) => ({
          name: (anchor.getAttribute('aria-label') ?? anchor.textContent ?? '').replace(/\s+/g, ' ').trim(),
          href: (anchor as HTMLAnchorElement).getAttribute('href') ?? '',
        })),
      )
      const destinationsByName = new Map<string, Set<string>>()
      for (const { name, href } of links) destinationsByName.set(name, (destinationsByName.get(name) ?? new Set()).add(href))
      for (const [name, destinations] of destinationsByName) {
        expect(destinations.size, `o nome "${name}" leva a destinos diferentes: ${[...destinations].join(' | ')}`).toBe(1)
      }
    })

    test('links externos para outro site avisam que abrem em nova aba', async ({ page }) => {
      await page.goto(path)
      const newTabLinks = page.locator('a[target="_blank"]')
      const count = await newTabLinks.count()
      for (let index = 0; index < count; index++) {
        const link = newTabLinks.nth(index)
        await expect(link).toHaveAttribute('rel', /noopener/)
        await expect(link).toContainText(/abre em nova aba|opens in a new tab/)
      }
    })
  })
}

test.describe('nomes acessíveis específicos', () => {
  test.use({ locale: 'pt-BR' })

  test('o link do código-fonte abre em nova aba e avisa', async ({ page }) => {
    await page.goto('/')
    const link = page.getByRole('link', { name: /Código-fonte deste site/ })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(link).toContainText('abre em nova aba')
  })

  test('o botão de PDF diz o tipo de arquivo e cada link de detalhes diz de qual projeto é', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Baixar PDF.*arquivo PDF/ })).toBeVisible()
    const details = page.locator('section[aria-labelledby="projects-title"] article a')
    const names = await details.allInnerTexts()
    expect(new Set(names).size).toBe(names.length)
  })

  test('blocos planejados dos diagramas têm texto para leitores de tela, além do tracejado', async ({ page }) => {
    await page.goto('/projetos/clinica/#clinica-audit-trail')
    const planned = page.locator('article [class*="border-dashed"]')
    const count = await planned.count()
    expect(count).toBeGreaterThan(0)
    for (let index = 0; index < count; index++) await expect(planned.nth(index)).toContainText('etapa planejada')
  })
})
