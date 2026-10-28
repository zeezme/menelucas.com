import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Gera avatar (busto) e favicons (rosto) recortando quadrados da foto.
 * Uso: npm run assets -- <foto> --bust=esquerda,topo,lado --face=esquerda,topo,lado
 * Ex.:  npm run assets -- IMG_9992.jpg --bust=1034,109,1960 --face=1387,163,1142
 * Os arquivos gerados ficam versionados em public/.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [src, ...flags] = process.argv.slice(2)
const region = (name: string) => {
  const raw = flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1]
  const [left, top, size] = (raw ?? '').split(',').map(Number)
  if (left === undefined || top === undefined || !size) {
    throw new Error(`Uso: npm run assets -- <foto> --bust=esq,topo,lado --face=esq,topo,lado (faltou --${name})`)
  }
  return { left, top, width: size, height: size }
}
if (!src) throw new Error('Informe a foto de origem.')
const BUST = region('bust')
const FACE = region('face')
const out = join(root, 'public')
mkdirSync(out, { recursive: true })

const BG = { r: 20, g: 21, b: 22, alpha: 1 } // surface-2 (fundo sob fotos com transparência)
const crop = (r: typeof BUST, size: number) =>
  sharp(src).extract(r).resize(size, size, { fit: 'cover' }).flatten({ background: BG })

await crop(BUST, 192).webp({ quality: 88 }).toFile(join(out, 'avatar.webp'))
await crop(FACE, 180).png().toFile(join(out, 'apple-touch-icon.png'))
await crop(FACE, 48).png().toFile(join(out, 'favicon.png'))

// favicon.ico (PNG embutido em contêiner ICO, 32x32)
const png32 = await crop(FACE, 32).png().toBuffer()
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
