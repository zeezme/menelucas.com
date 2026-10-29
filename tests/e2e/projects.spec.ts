import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PROJECTS = [
  { slug: 'ipsiq', title: 'iPsiq' },
  { slug: 'clinica', title: 'Luhmera' },
]

const LOCALES = [
  { locale: 'pt-BR', list: '/projetos/', resume: '/', menu: 'Menu de projetos', other: '/en/projects/', switchTo: 'EN' },
  { locale: 'en-US', list: '/en/projects/', resume: '/en/', menu: 'Projects menu', other: '/projetos/', switchTo: 'PT' },
] as const

const overflowOf = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

/** Os ids das partes vêm da própria barra lateral, então os testes não repetem a lista de partes. */
const panelIds = (page: Page): Promise<string[]> =>
  page.locator('[data-areas-nav] a').evaluateAll((links) => links.map((link) => (link.getAttribute('href') ?? '').slice(1)))

for (const { locale, list, resume, menu, other, switchTo } of LOCALES) {
  test.describe(`lista de projetos em ${list}`, () => {
    test.use({ locale })

    test('é um menu de links, um por projeto, para a página própria dele, sem o conteúdo dos projetos', async ({ page }) => {
      await page.goto(list)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Projetos|Projects/)
      const links = page.getByRole('navigation', { name: menu }).getByRole('link')
      await expect(links).toHaveCount(PROJECTS.length)
      for (const [index, { slug, title }] of PROJECTS.entries()) {
        await expect(links.nth(index)).toHaveAttribute('href', `${list}${slug}/`)
        await expect(links.nth(index)).toHaveAccessibleName(title)
      }
      await expect(page.locator('[data-areas-nav]')).toHaveCount(0)
      await expect(page.locator('main img')).toHaveCount(0)
    })

    test('clicar num item do menu abre a página do projeto', async ({ page }) => {
      await page.goto(list)
      await page.getByRole('navigation', { name: menu }).getByRole('link', { name: 'Luhmera' }).click()
      await expect(page).toHaveURL(new RegExp(`${list}clinica/$`))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Luhmera')
    })

    test('o endereço antigo com # (ex.: #clinica-audit-trail) leva à página do projeto, com a parte aberta', async ({ page }) => {
      await page.goto(`${list}#clinica-audit-trail`)
      await expect(page).toHaveURL(new RegExp(`${list}clinica/#clinica-audit-trail$`))
      await expect(page.locator('#clinica-audit-trail')).toBeVisible()
    })

    test('aba Projetos no currículo leva à lista e a aba Currículo volta', async ({ page }) => {
      await page.goto(resume)
      const tabs = page.getByRole('navigation', { name: /Seções do site|Site sections/ })
      await tabs.getByRole('link', { name: /Projetos|Projects/ }).click()
      await expect(page).toHaveURL(new RegExp(`${list}$`))
      await tabs.getByRole('link', { name: /Currículo|Resume/ }).click()
      await expect(page).toHaveURL(new RegExp(`${resume.replace(/\//g, '\\/')}$`))
    })

    test('a troca de idioma leva à mesma lista no outro idioma', async ({ page }) => {
      await page.goto(list)
      await page.getByRole('navigation', { name: /Idioma|Language/ }).getByRole('link', { name: new RegExp(`^${switchTo}`) }).click()
      await expect(page).toHaveURL(new RegExp(`${other.replace(/\//g, '\\/')}$`))
    })

    for (const width of [375, 1440]) {
      test(`sem overflow horizontal em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(list)
        expect(await overflowOf(page)).toBeLessThanOrEqual(0)
      })
    }

    for (const scheme of ['dark', 'light'] as const) {
      test(`sem violações de acessibilidade (axe), tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(list)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        await page.addStyleTag({ content: '*{transition:none!important}' })
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
      })
    }
  })

  for (const { slug, title } of PROJECTS) {
    test.describe(`página de ${title} em ${list}${slug}/`, () => {
      test.use({ locale })
      const path = `${list}${slug}/`

      test('barra lateral: abre uma parte por vez e atualiza o endereço', async ({ page }) => {
        await page.goto(path)
        const ids = await panelIds(page)
        expect(ids.length).toBeGreaterThan(1)
        const links = page.locator('[data-areas-nav] a')
        await expect(links.first()).toHaveAttribute('aria-current', 'true')
        await expect(page.locator(`#${ids[1]}`)).toBeHidden()
        for (const [index, id] of ids.entries()) {
          await links.nth(index).click()
          await expect(page).toHaveURL(new RegExp(`#${id}$`))
          await expect(page.locator(`#${id}`)).toBeVisible()
          await expect(links.nth(index)).toHaveAttribute('aria-current', 'true')
          await expect(page.locator(`section[id^="${slug}-"]:visible`)).toHaveCount(1)
        }
      })

      test('botões Anterior/Próxima no fim da parte funcionam (no celular a barra lateral fica no topo)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 700 })
        await page.goto(path)
        const ids = await panelIds(page)
        const pager = page.locator('[data-areas-pager]')
        const previous = pager.locator('[data-pager="prev"]')
        const next = pager.locator('[data-pager="next"]')
        await expect(previous).toBeHidden()
        await next.scrollIntoViewIfNeeded()
        await next.click()
        await expect(page).toHaveURL(new RegExp(`#${ids[1]}$`))
        await expect(page.locator(`#${ids[1]}`)).toBeVisible()
        await expect(page.locator(`#${ids[1]} h2`)).toBeInViewport()
        await expect(previous).toBeVisible()
        await page.goto(`${path}#${ids[ids.length - 1]}`)
        await expect(next).toBeHidden()
        await expect(previous).toBeVisible()
      })

      test('no desktop os botões Anterior/Próxima não aparecem (a barra lateral já está à vista)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.goto(path)
        await expect(page.locator('[data-areas-pager]:visible')).toHaveCount(0)
        await expect(page.locator('[data-areas-nav]:visible')).toBeVisible()
      })

      test('link direto com # abre a parte certa, e voltar restaura a anterior', async ({ page }) => {
        await page.goto(path)
        const ids = await panelIds(page)
        const target = ids[ids.length - 2] ?? ''
        await page.goto(`${path}#${target}`)
        await expect(page.locator(`#${target}`)).toBeVisible()
        await expect(page.locator(`#${ids[0]}`)).toBeHidden()
        await page.locator('[data-areas-nav] a').first().click()
        await expect(page.locator(`#${ids[0]}`)).toBeVisible()
        await page.goBack()
        await expect(page.locator(`#${target}`)).toBeVisible()
      })

      test('todas as imagens das partes carregam', async ({ page }) => {
        await page.goto(path)
        for (const id of await panelIds(page)) {
          await page.goto(`${path}#${id}`)
          const imgs = page.locator(`#${id} img`)
          for (let index = 0; index < (await imgs.count()); index++) {
            const img = imgs.nth(index)
            await img.scrollIntoViewIfNeeded()
            await expect
              .poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0), { message: `${id} imagem ${index}` })
              .toBe(true)
          }
        }
      })

      test('sem JavaScript todas as partes ficam visíveis em sequência, e os controles do JS ficam escondidos', async ({ browser }) => {
        const context = await browser.newContext({ locale, javaScriptEnabled: false })
        const page = await context.newPage()
        await page.goto(path)
        const parts = await page.locator('[data-areas-nav] a').count()
        expect(parts).toBeGreaterThan(1)
        await expect(page.locator(`section[id^="${slug}-"]:visible`)).toHaveCount(parts)
        await expect(page.locator('[data-areas-pager]')).toBeHidden()
        await context.close()
      })
    })
  }
}

test.describe('navegador em inglês', () => {
  test.use({ locale: 'en-US' })

  test('a lista em português redireciona para a versão em inglês na primeira visita', async ({ page }) => {
    await page.goto('/projetos/')
    await expect(page).toHaveURL(/\/en\/projects\/$/)
  })
})
