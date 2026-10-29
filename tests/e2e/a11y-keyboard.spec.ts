import { expect, test, type Page } from '@playwright/test'

const PAGES = [
  { path: '/', locale: 'pt-BR' },
  { path: '/projetos/', locale: 'pt-BR' },
  { path: '/en/projects/', locale: 'en-US' },
]

/** Percorre a página só com Tab e devolve, para cada parada de foco, o nome do elemento e se o foco está visível. */
const tabThrough = async (page: Page, maximumStops = 80) => {
  const stops: { name: string; hasFocusIndicator: boolean }[] = []
  await page.locator('body').press('Tab')
  for (let stop = 0; stop < maximumStops; stop++) {
    const current = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null
      if (!element || element === document.body) return null
      const style = getComputedStyle(element)
      return {
        name: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? '',
        hasFocusIndicator: style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0,
      }
    })
    if (!current) break
    if (stops.length > 2 && current.name === stops[0]?.name) break
    stops.push(current)
    await page.keyboard.press('Tab')
  }
  return stops
}

for (const { path, locale } of PAGES) {
  test.describe(`teclado em ${path}`, () => {
    test.use({ locale })

    test('todo controle recebe foco por Tab e mostra um indicador de foco', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(path)
      const stops = await tabThrough(page)
      expect(stops.length).toBeGreaterThan(5)
      for (const stop of stops) expect(stop.hasFocusIndicator, `sem indicador de foco: ${stop.name}`).toBe(true)
    })

    test('o primeiro foco é o link de pular para o conteúdo, e ele leva ao conteúdo', async ({ page }) => {
      await page.goto(path)
      await page.keyboard.press('Tab')
      const skipLink = page.locator('a[href="#content"]')
      await expect(skipLink).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('#content')).toBeFocused()
    })
  })
}

test.describe('página de um projeto', () => {
  test.use({ locale: 'pt-BR' })

  test('o botão de tema informa o estado com aria-pressed', async ({ page }) => {
    await page.goto('/projetos/ipsiq/')
    const toggle = page.getByRole('button', { name: 'Tema escuro' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.press('Enter')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('Anterior/Próxima por teclado levam o foco ao título da parte aberta e anunciam a troca', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 })
    await page.goto('/projetos/ipsiq/')
    const next = page.locator('[data-pager="next"]')
    await next.focus()
    await page.keyboard.press('Enter')
    const heading = page.locator('section:visible h2').first()
    await expect(heading).toBeFocused()
    const status = page.getByRole('status')
    await expect(status).toContainText('Parte aberta')
    await expect(status).toContainText(await heading.innerText())
  })

  test('trocar de parte pela barra lateral, por teclado, mantém o foco no link e anuncia a troca', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/projetos/ipsiq/')
    const second = page.locator('[data-areas-nav] a').nth(1)
    await second.focus()
    await page.keyboard.press('Enter')
    await expect(second).toBeFocused()
    await expect(second).toHaveAttribute('aria-current', 'true')
    await expect(page.getByRole('status')).toContainText(await second.innerText())
  })
})

test.describe('dicas dos controles com ícone', () => {
  test.use({ locale: 'pt-BR', viewport: { width: 1280, height: 900 } })

  test('aparecem no foco do teclado, ficam sem repetir o nome para leitores de tela e Esc as dispensa', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Tema escuro' })
    const tooltip = toggle.locator('xpath=following-sibling::*[contains(@class,"tooltip")]')
    await expect(tooltip).toBeHidden()
    await toggle.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveAttribute('aria-hidden', 'true')
    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()
  })

  test('aparecem com o mouse e continuam visíveis quando o ponteiro vai até a dica', async ({ page }) => {
    await page.goto('/')
    const github = page.getByRole('link', { name: 'GitHub' }).first()
    await github.hover()
    const tooltip = github.locator('xpath=following-sibling::*[contains(@class,"tooltip")]')
    await expect(tooltip).toBeVisible()
    await tooltip.hover()
    await expect(tooltip).toBeVisible()
  })
})

test.describe('botão de voltar ao topo', () => {
  test.use({ locale: 'pt-BR', viewport: { width: 1280, height: 700 } })

  test('só aparece depois de rolar, volta ao topo e devolve o foco ao início da página', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Voltar ao topo' })
    await expect(button).toBeHidden()
    await page.evaluate(() => window.scrollTo(0, 2500))
    await expect(button).toBeVisible()
    await button.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(button).toBeHidden()
    await expect(page.getByRole('link', { name: 'Currículo' }).first()).toBeFocused()
  })
})

test.describe('contorno do foco', () => {
  test.use({ locale: 'pt-BR', viewport: { width: 1280, height: 900 } })

  for (const path of ['/', '/projetos/', '/projetos/ipsiq/']) {
    test(`o contorno do foco nunca é cortado por um contêiner em ${path}`, async ({ page }) => {
      await page.goto(path)
      const clipped = await page.evaluate(() => {
        const margin = 4
        const problems: string[] = []
        for (const element of document.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]')) {
          if (element.getClientRects().length === 0 || element.closest('.sr-only')) continue
          const box = element.getBoundingClientRect()
          for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor)
            if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
            const limit = ancestor.getBoundingClientRect()
            const clips =
              box.left - margin < limit.left || box.right + margin > limit.right || box.top - margin < limit.top || box.bottom + margin > limit.bottom
            if (clips) problems.push(`${(element.textContent ?? '').trim().slice(0, 30)} dentro de ${ancestor.className.toString().slice(0, 50)}`)
          }
        }
        return problems
      })
      expect(clipped).toEqual([])
    })
  }
})
