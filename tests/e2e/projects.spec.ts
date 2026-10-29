import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const IDS = [
  'ipsiq-overview',
  'ipsiq-public-site',
  'ipsiq-doctor-area',
  'ipsiq-back-office',
  'ipsiq-access-and-permissions',
  'ipsiq-code-and-decorators',
  'ipsiq-audit-and-history',
  'ipsiq-data-redaction',
  'ipsiq-asaas-integration',
  'ipsiq-settings',
]

const PROJECT_PAGES = [
  {
    path: '/projetos/',
    locale: 'pt-BR',
    lang: 'pt-BR',
    h1: 'Projetos',
    other: '/en/projects/',
    tabs: ['Currículo', 'Projetos'],
    nav: /Partes do sistema/,
    parts: ['Visão geral', 'Site público', 'Área do médico', 'Backoffice', 'Acessos e permissões', 'Código e decorators', 'Auditoria e histórico', 'Mascaramento de dados', 'Integração com o Asaas', 'Configurações'],
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
    nav: /System parts/,
    parts: ['Overview', 'Public site', 'Doctor area', 'Back-office', 'Access and permissions', 'Code and decorators', 'Audit and history', 'Data redaction', 'Asaas integration', 'Settings'],
    note: 'fictitious data',
    switchTo: 'PT',
  },
]

for (const pp of PROJECT_PAGES) {
  test.describe(`página ${pp.path}`, () => {
    test.use({ locale: pp.locale })

    test('estrutura: h1, abas, painéis e nota de conformidade', async ({ page }) => {
      await page.goto(pp.path)
      await expect(page.locator('html')).toHaveAttribute('lang', pp.lang)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(pp.h1)
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('iPsiq')
      expect(await page.locator('h3').allTextContents()).toEqual(pp.parts)
      const tabs = page.getByRole('navigation', { name: /Seções do site|Site sections/ })
      await expect(tabs.getByRole('link')).toHaveText(pp.tabs)
      await expect(tabs.getByRole('link', { name: pp.tabs[1] ?? '' })).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('complementary')).toContainText('LGPD')
      await expect(page.getByRole('complementary')).toContainText('CFM')
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
    })

    test('barra lateral: abre uma parte por vez e atualiza o endereço', async ({ page }) => {
      await page.goto(pp.path)
      const nav = page.getByRole('navigation', { name: pp.nav })
      await expect(nav.getByRole('link')).toHaveText(pp.parts)
      await expect(nav.getByRole('link').first()).toHaveAttribute('aria-current', 'true')
      await expect(page.locator(`#${IDS[0]}`)).toBeVisible()
      await expect(page.locator(`#${IDS[1]}`)).toBeHidden()

      for (const [i, id] of IDS.entries()) {
        await nav.getByRole('link').nth(i).click()
        await expect(page).toHaveURL(new RegExp(`#${id}$`))
        await expect(page.locator(`#${id}`)).toBeVisible()
        await expect(nav.getByRole('link').nth(i)).toHaveAttribute('aria-current', 'true')
        await expect(page.locator('section[id^="ipsiq-"]:visible')).toHaveCount(1)
      }
    })

    test('botões Anterior/Próxima no fim da parte funcionam (no celular a barra lateral fica lá em cima)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 700 })
      await page.goto(pp.path)
      const pager = page.locator('[data-areas-pager]')
      const prev = pager.locator('[data-pager="prev"]')
      const next = pager.locator('[data-pager="next"]')
      await expect(pager).toBeVisible()
      await expect(prev).toBeHidden()
      await expect(next).toContainText(pp.parts[1] ?? '')
      await next.scrollIntoViewIfNeeded()
      await next.click()
      await expect(page).toHaveURL(new RegExp(`#${IDS[1]}$`))
      await expect(page.locator(`#${IDS[1]}`)).toBeVisible()
      await expect(prev).toContainText(pp.parts[0] ?? '')
      await expect(next).toContainText(pp.parts[2] ?? '')
      await expect(page.getByRole('heading', { level: 3, name: pp.parts[1] ?? '' })).toBeInViewport()
      await page.goto(`${pp.path}#${IDS[IDS.length - 1]}`)
      await expect(next).toBeHidden()
      await expect(prev).toContainText(pp.parts[pp.parts.length - 2] ?? '')
    })

    test('diagramas de fluxo: lista ordenada, sem overflow e sem imagem', async ({ page }) => {
      const expected: Record<string, { title: string; stages: number }> = {
        'ipsiq-code-and-decorators': { title: pp.lang === 'en' ? 'The path of a request' : 'O caminho de uma requisição', stages: 5 },
        'ipsiq-audit-and-history': { title: pp.lang === 'en' ? 'How a write becomes history' : 'Como uma escrita vira histórico', stages: 5 },
        'ipsiq-asaas-integration': { title: pp.lang === 'en' ? 'From payment to webhook' : 'Do pagamento ao webhook', stages: 5 },
      }
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        for (const [id, info] of Object.entries(expected)) {
          await page.goto(`${pp.path}#${id}`)
          const ol = page.locator(`#${id} figure ol`).first()
          await expect(ol).toBeVisible()
          await expect(ol.locator('> li')).toHaveCount(info.stages)
          await expect(page.locator(`#${id} figure`).first()).toContainText(info.title)
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect(overflow, `${id} @${width}`).toBeLessThanOrEqual(0)
        }
      }
    })

    test('link direto com # abre a parte certa, e voltar restaura a anterior', async ({ page }) => {
      await page.goto(`${pp.path}#ipsiq-audit-and-history`)
      await expect(page.locator('#ipsiq-audit-and-history')).toBeVisible()
      await expect(page.locator('#ipsiq-overview')).toBeHidden()
      await expect(page.getByRole('heading', { level: 3, name: pp.parts[6] ?? '' })).toBeVisible()
      await page.getByRole('navigation', { name: pp.nav }).getByRole('link').nth(0).click()
      await expect(page.locator('#ipsiq-overview')).toBeVisible()
      await page.goBack()
      await expect(page.locator('#ipsiq-audit-and-history')).toBeVisible()
    })

    test('as imagens de cada parte carregam, com alt', async ({ page }) => {
      const expected: Record<string, number> = {
        'ipsiq-public-site': 2,
        'ipsiq-doctor-area': 3,
        'ipsiq-back-office': 4,
        'ipsiq-access-and-permissions': 2,
        'ipsiq-audit-and-history': 4,
        'ipsiq-asaas-integration': 1,
        'ipsiq-settings': 1,
      }
      for (const [id, count] of Object.entries(expected)) {
        await page.goto(`${pp.path}#${id}`)
        const imgs = page.locator(`#${id} img`)
        await expect(imgs).toHaveCount(count)
        for (let i = 0; i < count; i++) {
          const img = imgs.nth(i)
          await img.scrollIntoViewIfNeeded()
          await expect
            .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { message: `${id} imagem ${i}` })
            .toBe(true)
          expect(((await img.getAttribute('alt')) ?? '').length).toBeGreaterThan(10)
        }
      }
      await page.goto(`${pp.path}#ipsiq-audit-and-history`)
      await expect(page.locator('#ipsiq-audit-and-history').getByText(pp.note)).toBeVisible()
    })

    for (const width of [375, 768, 1440]) {
      test(`sem overflow horizontal em ${width}px (painéis com tabela de código e imagens)`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        for (const id of ['ipsiq-overview', 'ipsiq-code-and-decorators', 'ipsiq-data-redaction', 'ipsiq-back-office']) {
          await page.goto(`${pp.path}#${id}`)
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect(overflow, id).toBeLessThanOrEqual(0)
        }
      })
    }

    for (const scheme of ['dark', 'light'] as const) {
      test(`sem violações de acessibilidade (axe), tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        for (const id of ['ipsiq-overview', 'ipsiq-code-and-decorators', 'ipsiq-audit-and-history', 'ipsiq-asaas-integration']) {
          await page.goto(`${pp.path}#${id}`)
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
          const results = await new AxeBuilder({ page }).analyze()
          expect(results.violations, id).toEqual([])
        }
      })
    }

    test('troca de idioma leva para a mesma página no outro idioma', async ({ page }) => {
      await page.goto(pp.path)
      await page
        .getByRole('navigation', { name: /Idioma|Language/ })
        .getByRole('link', { name: new RegExp(`^${pp.switchTo}`) })
        .click()
      await expect(page).toHaveURL(new RegExp(`${pp.other.replace(/\//g, '\\/')}(#ipsiq-overview)?$`))
    })

    test('troca de idioma mantém a parte selecionada', async ({ page }) => {
      await page.goto(`${pp.path}#ipsiq-audit-and-history`)
      await page
        .getByRole('navigation', { name: /Idioma|Language/ })
        .getByRole('link', { name: new RegExp(`^${pp.switchTo}`) })
        .click()
      await expect(page).toHaveURL(new RegExp(`${pp.other.replace(/\//g, '\\/')}#ipsiq-audit-and-history$`))
      await expect(page.locator('#ipsiq-audit-and-history')).toBeVisible()
      await expect(page.locator('#ipsiq-overview')).toBeHidden()
    })
  })
}

test.describe('sem JavaScript', () => {
  test.use({ locale: 'pt-BR', javaScriptEnabled: false })

  test('todas as partes ficam visíveis em sequência, com imagens e exemplos de código', async ({ page }) => {
    await page.goto('/projetos/')
    await expect(page.locator('section[id^="ipsiq-"]')).toHaveCount(10)
    await expect(page.locator('section[id^="ipsiq-"]:visible')).toHaveCount(10)
    await expect(page.locator('figure img')).toHaveCount(17)
    await expect(page.locator('pre')).toHaveCount(3)
    await expect(page.locator('figure ol')).toHaveCount(3)
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

test('sitemap inclui as páginas de projetos', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://menelucas.com/projetos/</loc>')
  expect(sitemap).toContain('<loc>https://menelucas.com/en/projects/</loc>')
})
