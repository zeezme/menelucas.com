import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resume, ui } from '../src/content'
import { renderPage } from '../src/render'
import { buildRobots, buildSitemap } from '../src/seo/head'
import { LOCALES } from '../src/schema/resume'
import { isIndexable, ogImagePath, ogImageSource, siteConfig } from '../src/site'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const distDir = join(root, 'dist')

const FONT_SRC = join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')

function compileCss(base: string): string {
  const tailwindCli = join(root, 'node_modules/tailwindcss/lib/cli.js')
  const css = execFileSync(process.execPath, [tailwindCli, '-i', 'src/styles/main.css', '--minify'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const fontFace = `@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(${base}assets/inter-latin.woff2) format("woff2-variations")}`
  return fontFace + css
}

/** Gera `dist/`: `/` (PT) e `/en/` (EN) como HTML estático, mais os arquivos de `public/`. */
export function build(): void {
  const base = siteConfig()
  const hash = (file: string) => createHash('sha1').update(readFileSync(join(root, 'public', file))).digest('hex').slice(0, 8)
  const site = { ...base, ogVersions: { pt: hash(ogImageSource('pt')), en: hash(ogImageSource('en')) } }
  rmSync(distDir, { recursive: true, force: true })
  mkdirSync(join(distDir, 'assets'), { recursive: true })
  cpSync(join(root, 'public'), distDir, { recursive: true })
  if (!existsSync(FONT_SRC)) throw new Error(`Fonte não encontrada: ${FONT_SRC}`)
  cpSync(FONT_SRC, join(distDir, 'assets/inter-latin.woff2'))

  for (const locale of LOCALES) {
    cpSync(join(root, 'public', ogImageSource(locale)), join(distDir, ogImagePath(site, locale)))
  }

  const css = compileCss(site.base)
  for (const locale of LOCALES) {
    const html = renderPage({ resume, ui, locale, site, css })
    const outDir = locale === 'pt' ? distDir : join(distDir, locale)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html)
  }
  if (isIndexable(site)) {
    writeFileSync(join(distDir, 'sitemap.xml'), buildSitemap(site))
    writeFileSync(join(distDir, 'robots.txt'), buildRobots(site))
  }
  const size = (p: string) => (readFileSync(join(distDir, p)).length / 1024).toFixed(1)
  console.log(`dist/index.html ${size('index.html')} kB · dist/en/index.html ${size('en/index.html')} kB (base ${site.base})`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build()
