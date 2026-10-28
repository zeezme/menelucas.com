import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Gera public/banner-pt.jpg e public/banner-en.jpg (1200×630, og:image de / e /en/) a partir da foto original.
 *
 * O fundo da foto tem vinheta, halo e textura; estendê-lo deixa emendas visíveis. Por isso a pessoa é recortada
 * (máscara suave por distância ao cinza do fundo, com a iluminação uniformizada) e colocada sobre um cinza liso
 * que cobre o banner inteiro. O texto é desenhado em Inter via Chromium.
 *
 * Uso: npm run banner -- <foto.jpg>
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = process.argv[2]
if (!src) throw new Error('Informe a foto de origem: npm run banner -- <foto.jpg>')

const W = 1200
const H = 630
const PHOTO_W = 512
const PHOTO_LEFT = 640

const COPY = {
  pt: { lang: 'pt-BR', role: 'Engenheiro de Software Sênior', techs: 'TypeScript · Node.js · NestJS · React', domain: 'KYC · AML · Sistemas Distribuídos' },
  en: { lang: 'en', role: 'Senior Software Engineer', techs: 'TypeScript · Node.js · NestJS · React', domain: 'KYC · AML · Distributed Systems' },
} as const

const font = pathToFileURL(
  join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
).href

// ---------- foto: recorte, máscara do fundo e iluminação ----------
const resized = await sharp(src).rotate().resize({ width: PHOTO_W }).removeAlpha().toBuffer()
const photoH = Math.min(H, (await sharp(resized).metadata()).height ?? H)
const cropped = await sharp(resized).extract({ left: 0, top: 0, width: PHOTO_W, height: photoH }).toBuffer()
// Margem replicada: a estimativa de iluminação perde precisão em bordas de imagem, então a borda real fica no meio.
const PAD = 64
const PW = PHOTO_W + 2 * PAD
const PH = photoH + 2 * PAD
const { data: raw } = await sharp(cropped)
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, extendWith: 'copy' })
  .raw()
  .toBuffer({ resolveWithObject: true })

const N = PW * PH

/** Desfoque tipo gaussiano (3 caixas) com zero fora da imagem; serve para numerador e máscara. */
function blur(input: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const r = Math.max(1, Math.round(sigma))
  const a = new Float32Array(input)
  const b = new Float32Array(input.length)
  const pass = (inp: Float32Array, out: Float32Array, horizontal: boolean) => {
    const len = horizontal ? w : h
    const lines = horizontal ? h : w
    const stride = horizontal ? 1 : w
    for (let l = 0; l < lines; l++) {
      const start = horizontal ? l * w : l
      let sum = 0
      for (let i = 0; i <= r && i < len; i++) sum += inp[start + i * stride] ?? 0
      for (let i = 0; i < len; i++) {
        out[start + i * stride] = sum / (2 * r + 1)
        const add = i + r + 1
        const rem = i - r
        if (add < len) sum += inp[start + add * stride] ?? 0
        if (rem >= 0) sum -= inp[start + rem * stride] ?? 0
      }
    }
  }
  for (let k = 0; k < 3; k++) {
    pass(a, b, true)
    pass(b, a, false)
  }
  return a
}

// Fundo = neutro (sem cor de pele/cabelo) e de brilho médio; o resto é pessoa/cadeira/notebook.
const backdrop = new Float32Array(N)
for (let i = 0; i < N; i++) {
  const r = raw[i * 3] ?? 0
  const g = raw[i * 3 + 1] ?? 0
  const bl = raw[i * 3 + 2] ?? 0
  const lum = 0.299 * r + 0.587 * g + 0.114 * bl
  backdrop[i] = Math.abs(r - g) <= 7 && Math.abs(g - bl) <= 9 && lum > 88 && lum < 140 ? 1 : 0
}
// Afasta a máscara das bordas da pessoa (cabelo, sombra de contorno).
const eroded = blur(backdrop, PW, PH, 4).map((v) => (v > 0.995 ? 1 : 0))

const field = [0, 1, 2].map((c) => {
  const num = new Float32Array(N)
  for (let i = 0; i < N; i++) num[i] = (eroded[i] ?? 0) * (raw[i * 3 + c] ?? 0)
  const near = { n: blur(num, PW, PH, 28), d: blur(eroded, PW, PH, 28) }
  const far = { n: blur(num, PW, PH, 140), d: blur(eroded, PW, PH, 140) }
  const out = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const dn = near.d[i] ?? 0
    out[i] = dn > 0.04 ? (near.n[i] ?? 0) / dn : (far.n[i] ?? 0) / Math.max(far.d[i] ?? 0, 1e-4)
  }
  return out
})

// Cor-alvo do fundo: média do campo de iluminação nas áreas realmente de fundo.
const target = [0, 1, 2].map((c) => {
  let s = 0
  let n = 0
  for (let i = 0; i < N; i++) {
    if ((eroded[i] ?? 0) > 0) {
      s += field[c]?.[i] ?? 0
      n++
    }
  }
  return s / Math.max(n, 1)
})

// Uniformiza a iluminação: pixel * (alvo / campo). A pessoa quase não muda (o campo é suave).
const flat = Buffer.alloc(N * 3)
for (let i = 0; i < N; i++) {
  for (let c = 0; c < 3; c++) {
    const v = (raw[i * 3 + c] ?? 0) * ((target[c] ?? 0) / Math.max(field[c]?.[i] ?? 1, 1))
    flat[i * 3 + c] = Math.max(0, Math.min(255, Math.round(v)))
  }
}
// Recorte da pessoa: quanto o pixel (já com iluminação uniformizada) se afasta do cinza do fundo.
// Ruído, halo e textura do fundo original ficam abaixo do limiar e viram cinza liso; cabelo, pele,
// camisa, calça, notebook e banco ficam opacos, com borda suave.
const dist = new Float32Array(N)
for (let i = 0; i < N; i++) {
  const dr = (flat[i * 3] ?? 0) - (target[0] ?? 0)
  const dg = (flat[i * 3 + 1] ?? 0) - (target[1] ?? 0)
  const db = (flat[i * 3 + 2] ?? 0) - (target[2] ?? 0)
  dist[i] = Math.sqrt(dr * dr + dg * dg + db * db)
}
const smooth = blur(dist, PW, PH, 1)
const D0 = 9
const D1 = 22
const rgba = Buffer.alloc(N * 4)
for (let i = 0; i < N; i++) {
  const t = Math.max(0, Math.min(1, ((smooth[i] ?? 0) - D0) / (D1 - D0)))
  rgba[i * 4] = flat[i * 3] ?? 0
  rgba[i * 4 + 1] = flat[i * 3 + 1] ?? 0
  rgba[i * 4 + 2] = flat[i * 3 + 2] ?? 0
  rgba[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255)
}
const photo = await sharp(rgba, { raw: { width: PW, height: PH, channels: 4 } })
  .extract({ left: PAD, top: PAD, width: PHOTO_W, height: photoH })
  .png()
  .toBuffer()
const bg = { r: Math.round(target[0] ?? 114), g: Math.round(target[1] ?? 114), b: Math.round(target[2] ?? 114) }

const base = await sharp({ create: { width: W, height: H, channels: 3, background: bg } })
  .composite([{ input: photo, left: PHOTO_LEFT, top: 0 }])
  .png()
  .toBuffer()

// ---------- texto ----------
const html = (c: (typeof COPY)[keyof typeof COPY]) => `<!doctype html><html lang="${c.lang}"><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${font}) format("woff2")}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#fff;
  background:url(data:image/png;base64,${base.toString('base64')}) 0 0/${W}px ${H}px}
.col{position:absolute;left:107px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.bar{width:57px;height:6px;border-radius:3px;background:#fff;opacity:.9;margin-bottom:28px}
h1{font-size:68px;font-weight:700;letter-spacing:-.035em;line-height:1.05}
.role{font-size:29px;font-weight:500;color:#f5f5f5;margin-top:14px;letter-spacing:-.01em}
.tech{font-size:24px;font-weight:400;color:#f5f5f5;margin-top:30px;line-height:1.5}
.url{font-size:24px;font-weight:600;color:#fff;margin-top:52px}
</style><div class="col"><div class="bar"></div><h1>Lucas Menezes</h1>
<div class="role">${c.role}</div>
<div class="tech">${c.techs}<br>${c.domain}</div>
<div class="url">menelucas.com</div></div>`

const tmp = mkdtempSync(join(tmpdir(), 'banner-'))
const browser = await chromium.launch()
try {
  const tab = await browser.newPage({ viewport: { width: W, height: H } })
  for (const locale of ['pt', 'en'] as const) {
    const page = join(tmp, `banner-${locale}.html`)
    writeFileSync(page, html(COPY[locale]))
    await tab.goto(pathToFileURL(page).href)
    await tab.evaluate(() => document.fonts.ready)
    const png = await tab.screenshot({ type: 'png' })
    const jpg = await sharp(png).jpeg({ quality: 88, mozjpeg: true, progressive: false }).toBuffer()
    writeFileSync(join(root, `public/banner-${locale}.jpg`), jpg)
    console.log(`public/banner-${locale}.jpg ${W}x${H}, ${(jpg.length / 1024).toFixed(0)} kB`)
  }
  copyFileSync(join(root, 'public/banner-pt.jpg'), join(root, 'public/banner.jpg'))
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}
