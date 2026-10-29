import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { interfaceTexts, resume } from '../src/content'
import { pageFile, type PageId } from '../src/internationalization'
import { renderPage } from '../src/render'
import { LOCALES, showcaseProjects } from '../src/schema/resume'
import { buildRobots, buildSitemap } from '../src/seo/head'
import { isIndexable, openGraphImagePath, openGraphImageSource, siteConfig } from '../src/site'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Pasta de saída do build. */
export const distDir = join(root, 'dist')

const FONT_SOURCE = join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')

/**
 * Compila o Tailwind e acrescenta o `@font-face` da fonte local.
 * @param base Prefixo de publicação, usado no endereço da fonte.
 */
const compileCss = (base: string): string => {
  const tailwindCli = join(root, 'node_modules/tailwindcss/lib/cli.js')
  const css = execFileSync(process.execPath, [tailwindCli, '-i', 'src/styles/main.css', '--minify'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const fontFace = `@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(${base}assets/inter-latin.woff2) format("woff2-variations")}`
  return fontFace + css
}

/** Gera `dist/`: as páginas em PT e EN como HTML estático, os arquivos de `public/`, o sitemap e o robots. */
export const build = (): void => {
  const baseConfig = siteConfig()
  const hashOf = (file: string) =>
    createHash('sha1').update(readFileSync(join(root, 'public', file))).digest('hex').slice(0, 8)
  const site = {
    ...baseConfig,
    openGraphVersions: { pt: hashOf(openGraphImageSource('pt')), en: hashOf(openGraphImageSource('en')) },
  }
  rmSync(distDir, { recursive: true, force: true })
  mkdirSync(join(distDir, 'assets'), { recursive: true })
  cpSync(join(root, 'public'), distDir, { recursive: true })
  if (!existsSync(FONT_SOURCE)) throw new Error(`Fonte não encontrada: ${FONT_SOURCE}`)
  cpSync(FONT_SOURCE, join(distDir, 'assets/inter-latin.woff2'))

  for (const locale of LOCALES) {
    cpSync(join(root, 'public', openGraphImageSource(locale)), join(distDir, openGraphImagePath(site, locale)))
  }

  const css = compileCss(site.base)
  const pages: PageId[] = showcaseProjects(resume).length > 0 ? ['resume', 'projects'] : ['resume']
  for (const page of pages) {
    for (const locale of LOCALES) {
      const file = join(distDir, pageFile(page, locale))
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, renderPage({ resume, interfaceTexts, locale, site, css, page }))
    }
  }
  if (isIndexable(site)) {
    writeFileSync(join(distDir, 'sitemap.xml'), buildSitemap(site, pages))
    writeFileSync(join(distDir, 'robots.txt'), buildRobots(site))
  }
  const sizeInKilobytes = (path: string) => (readFileSync(join(distDir, path)).length / 1024).toFixed(1)
  console.log(
    `dist/index.html ${sizeInKilobytes('index.html')} kB · dist/en/index.html ${sizeInKilobytes('en/index.html')} kB (base ${site.base})`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build()
