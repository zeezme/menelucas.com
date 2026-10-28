import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp, { type Color } from 'sharp'

/**
 * Gera avatar e favicons a partir da foto (recorte transparente).
 * Uso: npm run assets -- "C:\caminho\foto_sem_fundo.png"
 * Os arquivos gerados ficam versionados em public/.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = process.argv[2]
if (!src) throw new Error('Informe o caminho da foto: npm run assets -- <foto.png>')
const out = join(root, 'public')
mkdirSync(out, { recursive: true })

const BG = { r: 20, g: 21, b: 22, alpha: 1 } // surface-2
const photo = sharp(src).trim()

const square = async (size: number, background: Color) =>
  photo
    .clone()
    .resize(size, size, { fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background })

await (await square(160, BG)).webp({ quality: 88 }).toFile(join(out, 'avatar.webp'))
await (await square(180, BG)).png().toFile(join(out, 'apple-touch-icon.png'))
await (await square(48, BG)).png().toFile(join(out, 'favicon.png'))

// favicon.ico (PNG embutido em contêiner ICO, 32x32)
const png32 = await (await square(32, BG)).png().toBuffer()
const header = Buffer.alloc(22)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header.writeUInt8(32, 6)
header.writeUInt8(32, 7)
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(png32.length, 14)
header.writeUInt32LE(22, 18)
writeFileSync(join(out, 'favicon.ico'), Buffer.concat([header, png32]))
console.log('avatar.webp, apple-touch-icon.png, favicon.png, favicon.ico gerados em public/')
