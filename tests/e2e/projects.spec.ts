import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PROJECT_PAGES = [
  { path: '/projetos/', locale: 'pt-BR', other: '/en/projects/', nav: /Partes do sistema/, switchTo: 'EN' },
  { path: '/en/projects/', locale: 'en-US', other: '/projetos/', nav: /System parts/, switchTo: 'PT' },
]

/** Os ids das partes vêm da própria barra lateral, então os testes não repetem a lista de partes. */
const navOf = (page: Page, nav: RegExp, project = 0) => page.locator('article').nth(project).getByRole('navigation', { name: nav })

const panelIds = async (page: Page, nav: RegExp, project = 0): Promise<string[]> =>
  navOf(page, nav, project)
    .getByRole('link')
    .evaluateAll((links) => links.map((a) => (a.getAttribute('href') ?? '').slice(1)))

const overflowOf = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

for (const pp of PROJECT_PAGES) {
  test.describe(`página ${pp.path}`, () => {
    test.use({ locale: pp.locale })

    test('barra lateral: abre uma parte por vez e atualiza o endereço', async ({ page }) => {
      await page.goto(pp.path)
      const ids = await panelIds(page, pp.nav)
      expect(ids.length).toBeGreaterThan(1)
      const links = navOf(page, pp.nav).getByRole('link')
      await expect(links.first()).toHaveAttribute('aria-current', 'true')
      await expect(page.locator(`#${ids[1]}`)).toBeHidden()

      for (const [i, id] of ids.entries()) {
        await links.nth(i).click()
        await expect(page).toHaveURL(new RegExp(`#${id}$`))
        await expect(page.locator(`#${id}`)).toBeVisible()
        await expect(links.nth(i)).toHaveAttribute('aria-current', 'true')
        await expect(page.locator('section[id^="ipsiq-"]:visible')).toHaveCount(1)
      }
    })

    test('botões Anterior/Próxima no fim da parte funcionam (no celular a barra lateral fica lá em cima)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 700 })
      await page.goto(pp.path)
      const ids = await panelIds(page, pp.nav)
      const pager = page.locator('article').first().locator('[data-areas-pager]')
      const prev = pager.locator('[data-pager="prev"]')
      const next = pager.locator('[data-pager="next"]')
      await expect(prev).toBeHidden()
      await next.scrollIntoViewIfNeeded()
      await next.click()
      await expect(page).toHaveURL(new RegExp(`#${ids[1]}$`))
      await expect(page.locator(`#${ids[1]}`)).toBeVisible()
      await expect(page.locator(`#${ids[1]} h3`)).toBeInViewport()
      await expect(prev).toBeVisible()
      await page.goto(`${pp.path}#${ids[ids.length - 1]}`)
      await expect(next).toBeHidden()
      await expect(prev).toBeVisible()
    })

    test('link direto com # abre a parte certa, e voltar restaura a anterior', async ({ page }) => {
      await page.goto(pp.path)
      const ids = await panelIds(page, pp.nav)
      const target = ids[ids.length - 2] ?? ''
      await page.goto(`${pp.path}#${target}`)
      await expect(page.locator(`#${target}`)).toBeVisible()
      await expect(page.locator(`#${ids[0]}`)).toBeHidden()
      await navOf(page, pp.nav).getByRole('link').first().click()
      await expect(page.locator(`#${ids[0]}`)).toBeVisible()
      await page.goBack()
      await expect(page.locator(`#${target}`)).toBeVisible()
    })

    test('todas as imagens das partes carregam', async ({ page }) => {
      await page.goto(pp.path)
      for (const id of await panelIds(page, pp.nav)) {
        await page.goto(`${pp.path}#${id}`)
        const imgs = page.locator(`#${id} img`)
        for (let i = 0; i < (await imgs.count()); i++) {
          const img = imgs.nth(i)
          await img.scrollIntoViewIfNeeded()
          await expect
            .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { message: `${id} imagem ${i}` })
            .toBe(true)
        }
      }
    })

    for (const width of [375, 1440]) {
      test(`sem overflow horizontal em ${width}px em nenhuma parte (tabelas de código, diagramas e imagens)`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(pp.path)
        for (const id of await panelIds(page, pp.nav)) {
          await page.goto(`${pp.path}#${id}`)
          expect(await overflowOf(page), id).toBeLessThanOrEqual(0)
        }
      })
    }

    for (const scheme of ['dark', 'light'] as const) {
      test(`sem violações de acessibilidade (axe), tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(pp.path)
        const ids = await panelIds(page, pp.nav)
        // A visão geral, uma parte com código, uma com diagramas e a última (galeria).
        for (const id of new Set([ids[0], ids.find((i) => i.includes('code')), ids.find((i) => i.includes('audit')), ids[ids.length - 1]])) {
          await page.goto(`${pp.path}#${id}`)
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
          const results = await new AxeBuilder({ page }).analyze()
          expect(results.violations, id).toEqual([])
        }
      })
    }

    test('troca de idioma leva para a mesma página, na mesma parte', async ({ page }) => {
      await page.goto(pp.path)
      const ids = await panelIds(page, pp.nav)
      const target = ids[ids.length - 2] ?? ''
      await page.goto(`${pp.path}#${target}`)
      await page
        .getByRole('navigation', { name: /Idioma|Language/ })
        .getByRole('link', { name: new RegExp(`^${pp.switchTo}`) })
        .click()
      await expect(page).toHaveURL(new RegExp(`${pp.other.replace(/\//g, '\\/')}#${target}$`))
      await expect(page.locator(`#${target}`)).toBeVisible()
      await expect(page.locator(`#${ids[0]}`)).toBeHidden()
    })
  })
}

for (const pp of PROJECT_PAGES) {
  test.describe(`projeto confidencial em ${pp.path}`, () => {
    test.use({ locale: pp.locale })

    test('vem depois do primeiro, abre pelo link do currículo, tem aviso e não tem imagens', async ({ page }) => {
      const resumePath = pp.locale === 'pt-BR' ? '/' : '/en/'
      await page.goto(resumePath)
      const card = page.locator('section[aria-labelledby="projects-title"] article').nth(1)
      await card.getByRole('link').click()
      await expect(page).toHaveURL(new RegExp(`${pp.path}#clinica-overview$`))
      await expect(page.locator('#clinica-overview')).toBeVisible()
      await expect(page.locator('article').nth(1).locator('aside')).toBeVisible()
      await expect(page.locator('article').nth(1).locator('img')).toHaveCount(0)
      await expect(page.locator('#clinica-overview h3')).toBeInViewport()
    })

    test('todas as partes cabem em 375px e os diagramas passam no axe, nos dois temas', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 })
      await page.goto(pp.path)
      const ids = await panelIds(page, pp.nav, 1)
      expect(ids.length).toBeGreaterThan(1)
      for (const id of ids) {
        await page.goto(`${pp.path}#${id}`)
        await expect(page.locator(`#${id}`)).toBeVisible()
        expect(await overflowOf(page), id).toBeLessThanOrEqual(0)
      }
      for (const scheme of ['dark', 'light'] as const) {
        await page.emulateMedia({ colorScheme: scheme })
        for (const id of ids) {
          await page.goto(`${pp.path}#${id}`)
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
          await page.addStyleTag({ content: '*{transition:none!important}' }) // a troca de tema anima as cores; o axe mediria no meio
          const results = await new AxeBuilder({ page }).analyze()
          expect(results.violations, `${scheme} ${id}`).toEqual([])
        }
      }
    })

    test('abrir uma parte do segundo projeto não fecha a do primeiro', async ({ page }) => {
      await page.goto(pp.path)
      const first = await panelIds(page, pp.nav, 0)
      const second = await panelIds(page, pp.nav, 1)
      await page.goto(`${pp.path}#${first[2]}`)
      await page.goto(`${pp.path}#${second[1]}`)
      await expect(page.locator(`#${second[1]}`)).toBeVisible()
      await expect(page.locator(`#${first[2]}`)).toBeVisible()
    })
  })
}

test.describe('sem JavaScript', () => {
  test.use({ locale: 'pt-BR', javaScriptEnabled: false })

  test('todas as partes ficam visíveis em sequência, e os controles do JS ficam escondidos', async ({ page }) => {
    await page.goto('/projetos/')
    const parts = await page.locator('[data-areas-nav] a').count()
    expect(parts).toBeGreaterThan(1)
    await expect(page.locator('article section[id]:visible')).toHaveCount(parts)
    await expect(page.locator('[data-areas-pager]').first()).toBeHidden()
  })
})

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
