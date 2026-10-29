import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Gera as imagens que o Google usa na busca: o ícone do site (favicon, em múltiplos de 48 px) e as imagens da
 * pessoa nas proporções 1:1, 4:3 e 16:9, sem texto, para o recorte quadrado da miniatura mostrar o rosto e o notebook.
 * O banner de compartilhamento (`npm run banner`) continua sendo o `og:image` de WhatsApp e LinkedIn.
 *
 * Use a foto original, em alta resolução (a de 794 px fica borrada): npm run google-images -- <foto.jpg>
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDirectory = join(root, 'public')
const source = process.argv[2]
if (!source) throw new Error('Informe a foto de origem: npm run google-images -- <foto.jpg>')

/** Rosto com o cabelo e a barba inteiros, para o ícone pequeno ainda ser reconhecível (coordenadas da foto original, 3265 × 4898). */
const FACE = { left: 1300, top: 120, width: 1300, height: 1300 }

/** Da cabeça ao notebook e às mãos (coordenadas da foto original). As proporções mais largas completam as laterais com o fundo liso. */
const PHOTO = { left: 60, top: 130, width: 3100, height: 3100 }

/** Mesma altura, mas com a largura toda da foto: o notebook fica longe da borda e não some no esmaecimento das proporções largas. */
const WIDE_PHOTO = { left: 0, top: 130, width: 3265, height: 3100 }

const FRAMES = {
  'google-1x1.jpg': { aspect: 1, output: { width: 1200, height: 1200 } },
  'google-4x3.jpg': { aspect: 4 / 3, output: { width: 1600, height: 1200 } },
  'google-16x9.jpg': { aspect: 16 / 9, output: { width: 1920, height: 1080 } },
} as const

const background = { r: 20, g: 21, b: 22, alpha: 1 }
const face = (size: number) => sharp(source).rotate().extract(FACE).resize(size, size, { fit: 'cover' }).flatten({ background })

for (const size of [48, 96, 192]) {
  await face(size).png().toFile(join(publicDirectory, size === 48 ? 'favicon.png' : `favicon-${size}.png`))
}
await face(180).png().toFile(join(publicDirectory, 'apple-touch-icon.png'))

/** favicon.ico com 16, 32 e 48 px (PNG dentro de um contêiner ICO). */
const iconSizes = [16, 32, 48]
const images = await Promise.all(iconSizes.map((size) => face(size).png().toBuffer()))
const header = Buffer.alloc(6 + 16 * images.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = header.length
images.forEach((image, index) => {
  const entry = 6 + 16 * index
  header.writeUInt8(iconSizes[index] ?? 0, entry)
  header.writeUInt8(iconSizes[index] ?? 0, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
})
writeFileSync(join(publicDirectory, 'favicon.ico'), Buffer.concat([header, ...images]))

const photo = await sharp(source).rotate().extract(PHOTO).toBuffer()
const widePhoto = await sharp(source).rotate().extract(WIDE_PHOTO).toBuffer()

/**
 * Proporções mais largas que a foto: cada lateral vem da faixa de fundo liso da borda correspondente da foto,
 * esticada e desfocada (sem listras nem manchas), e a foto inteira fica no centro com as bordas esmaecidas.
 */
const widen = async ({ width, height }: { width: number; height: number }): Promise<Buffer> => {
  const half = Math.ceil(width / 2)
  const strip = (left: number) =>
    sharp(widePhoto).extract({ left, top: 0, width: 24, height: WIDE_PHOTO.height }).resize(half, height, { fit: 'fill' }).blur(24).toBuffer()
  const background = await sharp({ create: { width, height, channels: 3, background: { r: 120, g: 120, b: 120 } } })
    .composite([
      { input: await strip(0), left: 0, top: 0 },
      { input: await strip(WIDE_PHOTO.width - 24), left: width - half, top: 0 },
    ])
    .png()
    .toBuffer()
  const foregroundWidth = Math.round(height * (WIDE_PHOTO.width / WIDE_PHOTO.height))
  const feather = 0.025
  const mask = Buffer.from(
    `<svg width="${foregroundWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${feather}" stop-color="#fff" stop-opacity="1"/>` +
      `<stop offset="${1 - feather}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#fade)"/></svg>`,
  )
  const foreground = await sharp(widePhoto)
    .resize(foregroundWidth, height)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(background)
    .composite([{ input: foreground, left: Math.round((width - foregroundWidth) / 2), top: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
}

for (const [file, { aspect, output }] of Object.entries(FRAMES)) {
  const image =
    aspect === 1
      ? await sharp(photo).resize(output.width, output.height).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
      : await widen(output)
  writeFileSync(join(publicDirectory, file), image)
}
console.log('favicon.ico, favicon.png, favicon-96.png, favicon-192.png, apple-touch-icon.png e google-*.jpg gerados em public/')
