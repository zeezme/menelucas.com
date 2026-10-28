import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Gera public/banner.jpg (1200×630, og:image) a partir da foto original: o fundo cinza da foto
 * é estendido para a esquerda (replicando as bordas) e o texto é desenhado em Inter via Chromium.
 * Uso: npm run banner -- <foto.jpg>
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = process.argv[2]
if (!src) throw new Error('Informe a foto de origem: npm run banner -- <foto.jpg>')

const W = 1200
const H = 630
const PHOTO_W = 512 // largura da foto no banner
const PHOTO_LEFT = 640
const FEATHER = 28
const font = pathToFileURL(
  join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
).href

const resized = await sharp(src).rotate().resize({ width: PHOTO_W }).toBuffer()
const photoH = Math.min(H, (await sharp(resized).metadata()).height ?? H)
const photo = await sharp(resized).extract({ left: 0, top: 0, width: PHOTO_W, height: photoH }).toBuffer()
const right = W - PHOTO_LEFT - PHOTO_W

// Fundo: bordas da foto replicadas para os lados e suavizadas.
// (extract roda antes de extend no pipeline do sharp, então são dois passos.)
const extended = await sharp(photo).extend({ left: PHOTO_LEFT, right, extendWith: 'copy' }).toBuffer()
const background = await sharp(extended)
  .extract({ left: 0, top: 0, width: W, height: photoH })
  .blur(24)
  .toBuffer()

// Foto nítida por cima, com bordas laterais esmaecidas para não deixar emenda.
const mask = Buffer.from(
  `<svg width="${PHOTO_W}" height="${photoH}" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000"/><stop offset="${FEATHER / PHOTO_W}" stop-color="#fff"/>
    <stop offset="${1 - FEATHER / PHOTO_W}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
  </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
)
const feathered = await sharp(photo)
  .joinChannel(await sharp(mask).greyscale().toColourspace('b-w').toBuffer())
  .png()
  .toBuffer()

const base = await sharp(background)
  .composite([{ input: feathered, left: PHOTO_LEFT, top: 0 }])
  .png()
  .toBuffer()

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${font}) format("woff2")}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#fff;
  background:url(data:image/png;base64,${base.toString('base64')}) 0 0/${W}px ${H}px}
.col{position:absolute;left:107px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:0;text-shadow:0 1px 12px rgba(0,0,0,.25)}
.bar{width:57px;height:8px;border-radius:4px;background:#3b82f6;margin-bottom:28px}
h1{font-size:68px;font-weight:700;letter-spacing:-.035em;line-height:1.05}
.role{font-size:29px;font-weight:500;color:#f3f4f6;margin-top:14px;letter-spacing:-.01em}
.tech{font-size:24px;font-weight:400;color:#f3f4f6;margin-top:30px;line-height:1.5}
.url{font-size:24px;font-weight:600;color:#fff;margin-top:52px}
</style><div class="col"><div class="bar"></div><h1>Lucas Menezes</h1>
<div class="role">Senior Software Engineer</div>
<div class="tech">TypeScript · Node.js · NestJS · React<br>KYC · AML · Distributed Systems</div>
<div class="url">menelucas.com</div></div>`

const tmp = mkdtempSync(join(tmpdir(), 'banner-'))
const page = join(tmp, 'banner.html')
writeFileSync(page, html)
const browser = await chromium.launch()
try {
  const tab = await browser.newPage({ viewport: { width: W, height: H } })
  await tab.goto(pathToFileURL(page).href)
  await tab.evaluate(() => document.fonts.ready)
  const png = await tab.screenshot({ type: 'png' })
  const jpg = await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  writeFileSync(join(root, 'public/banner.jpg'), jpg)
  console.log(`public/banner.jpg ${W}x${H}, ${(jpg.length / 1024).toFixed(0)} kB`)
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}
