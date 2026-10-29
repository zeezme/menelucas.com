import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', lang: 'pt-BR', h2: ['Resumo', 'Competências', 'Experiência', 'Projetos', 'Formação', 'Idiomas'], pdf: '/cv.pdf', cta: 'Baixar PDF' },
  { path: '/en/', lang: 'en', h2: ['Summary', 'Skills', 'Experience', 'Projects', 'Education', 'Languages'], pdf: '/cv-en.pdf', cta: 'Download PDF' },
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
    })

    test('botão de PDF aponta para o PDF do idioma e ele existe', async ({ page, request }) => {
      await page.goto(p.path)
      await expect(page.getByRole('link', { name: p.cta })).toHaveAttribute('href', p.pdf)
      const res = await request.get(p.pdf)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('pdf')
    })

    test('og:image do idioma existe e é um JPEG 1200×630', async ({ page, request }) => {
      await page.goto(p.path)
      const url = new URL((await page.locator('meta[property="og:image"]').getAttribute('content')) ?? '')
      const res = await request.get(url.pathname)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toBe('image/jpeg')
      const meta = await (await import('sharp')).default(await res.body()).metadata()
      expect([meta.width, meta.height]).toEqual([1200, 630])
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

    for (const width of [375, 1440]) {
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
      const targets = page.locator('header a, #profile a')
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
  expect(sitemap).toContain('<loc>https://menelucas.com/projetos/</loc>')
  expect(sitemap).toContain('<loc>https://menelucas.com/en/projects/</loc>')
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

  test('ao trocar de tema as transições ficam desligadas, para o item selecionado não piscar', async ({ page }) => {
    await page.goto('/projetos/')
    // O clique e a leitura acontecem no mesmo instante, antes de o navegador pintar o próximo quadro.
    const duringSwitch = await page.evaluate(() => {
      const selected = document.querySelector('[aria-current="page"]') as HTMLElement
      ;(document.querySelector('[data-theme-toggle]') as HTMLElement).click()
      return getComputedStyle(selected).transitionDuration
    })
    expect(duringSwitch).toBe('0s')
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-switching', '')
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

test.describe('impressão usa fundo branco e texto escuro, mesmo com o tema escuro', () => {
  test.use({ colorScheme: 'dark' })

  for (const choice of ['sistema', 'botão'] as const) {
    test(`tema escuro vindo do ${choice}`, async ({ page }) => {
      await page.goto('/')
      if (choice === 'botão') {
        await page.emulateMedia({ colorScheme: 'light' })
        await page.getByRole('button', { name: /tema|theme/i }).click() // claro → escuro, escolha salva
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      }
      await page.emulateMedia({ media: 'print' })
      const colors = await page.evaluate(() => ({
        bg: getComputedStyle(document.body).backgroundColor,
        text: getComputedStyle(document.querySelector('h1') as Element).color,
      }))
      expect(colors.bg).toMatch(/rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)/)
      expect(colors.text).toBe('rgb(0, 0, 0)')
    })
  }
})

test('o site final não expõe dados do projeto confidencial além do nome do produto', async ({ request }) => {
  const paths = ['/', '/en/', '/projetos/', '/en/projects/', '/sitemap.xml', '/robots.txt']
  for (const path of paths) {
    const text = await (await request.get(path)).text()
    // O nome "Luhmera" pode aparecer; a empresa e qualquer variação (domínio, minúsculas) não.
    expect(text.replaceAll('Luhmera', ''), path).not.toMatch(/luhmera|LM Solutions/i)
  }
})

test.describe('celular (375px)', () => {
  test.use({ locale: 'pt-BR', viewport: { width: 375, height: 812 } })

  for (const path of ['/', '/projetos/']) {
    test(`a barra superior fica numa linha só em ${path}`, async ({ page }) => {
      await page.goto(path)
      const tops = await page.evaluate(() =>
        [...document.querySelectorAll('header nav a, header button')].map((element) => Math.round(element.getBoundingClientRect().top)),
      )
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(8)
    })
  }

  test('os botões de contato ocupam a largura toda de cada coluna', async ({ page }) => {
    await page.goto('/')
    const widths = await page.locator('nav[aria-label="Contato"] a').evaluateAll((links) =>
      links.map((link) => Math.round(link.getBoundingClientRect().width)),
    )
    expect(widths).toHaveLength(4)
    const column = Math.round((375 - 32 - 8) / 2)
    for (const width of widths) expect(width).toBeGreaterThanOrEqual(column - 2)
  })
})

test.describe('imagens da busca do Google', () => {
  test('o ícone existe em tamanhos múltiplos de 48 px e as imagens da pessoa têm as três proporções, sem texto no recorte quadrado', async ({ page, request }) => {
    await page.goto('/')
    const sharp = (await import('sharp')).default
    const icons = await page.locator('link[rel="icon"][type="image/png"]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
    expect(icons.length).toBeGreaterThanOrEqual(3)
    for (const href of icons) {
      const response = await request.get(href)
      expect(response.status(), href).toBe(200)
      const { width, height } = await sharp(await response.body()).metadata()
      expect(width, href).toBe(height)
      expect((width ?? 0) % 48, href).toBe(0)
    }

    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}') as {
      '@graph': { '@type': string; image?: { url: string; width: number; height: number }[] }[]
    }
    const images = ld['@graph'].find((node) => node['@type'] === 'Person')?.image ?? []
    const ratios = []
    for (const image of images) {
      const response = await request.get(new URL(image.url).pathname)
      expect(response.status(), image.url).toBe(200)
      const { width, height } = await sharp(await response.body()).metadata()
      expect([width, height], image.url).toEqual([image.width, image.height])
      expect((width ?? 0) * (height ?? 0), image.url).toBeGreaterThanOrEqual(50_000)
      ratios.push(Math.round(((width ?? 0) / (height ?? 1)) * 100) / 100)
    }
    expect(ratios).toEqual([1, 1.33, 1.78])
  })
})
