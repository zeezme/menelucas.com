import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Gera as imagens que o Google usa na busca: o ícone do site (favicon, em múltiplos de 48 px) e as imagens da
 * pessoa nas proporções 1:1, 4:3 e 16:9, sem texto, para o recorte quadrado da miniatura mostrar o rosto e o notebook.
 * O banner de compartilhamento (`npm run banner`) continua sendo o `og:image` de WhatsApp e LinkedIn.
 *
 * Uso: npm run google-images -- <foto.jpg>
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDirectory = join(root, 'public')
const source = process.argv[2]
if (!source) throw new Error('Informe a foto de origem: npm run google-images -- <foto.jpg>')

/** Rosto com o cabelo e a barba inteiros, para o ícone pequeno ainda ser reconhecível. */
const FACE = { left: 275, top: 15, width: 370, height: 370 }

/** A foto inteira (rosto e notebook). As proporções mais largas estendem as laterais com o cinza liso do fundo. */
const PHOTO = { left: 0, top: 0, width: 794, height: 794 }

const FRAMES = {
  'google-1x1.jpg': { aspect: 1, output: { width: 900, height: 900 } },
  'google-4x3.jpg': { aspect: 4 / 3, output: { width: 1200, height: 900 } },
  'google-16x9.jpg': { aspect: 16 / 9, output: { width: 1200, height: 675 } },
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
for (const [file, { aspect, output }] of Object.entries(FRAMES)) {
  const extra = Math.max(0, Math.round((PHOTO.height * aspect - PHOTO.width) / 2))
  // O sharp aplica `extend` depois de `resize`; por isso a foto estendida vira um buffer antes de ser redimensionada.
  const widened = await sharp(photo).extend({ left: extra, right: extra, extendWith: 'copy' }).toBuffer()
  await sharp(widened)
    .resize(output.width, output.height, { fit: 'cover' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(join(publicDirectory, file))
}
console.log('favicon.ico, favicon.png, favicon-96.png, favicon-192.png, apple-touch-icon.png e google-*.jpg gerados em public/')
