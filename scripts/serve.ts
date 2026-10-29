import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** Tipo de conteúdo de cada extensão servida. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

/**
 * Servidor estático mínimo para `dist/`, com a mesma regra do CloudFront: diretório vira `index.html`.
 * @param port Porta de escuta; padrão `PORT` ou 4321.
 * @param directory Pasta servida; padrão `dist/`.
 */
export const serve = (port = Number(process.env['PORT'] ?? 4321), directory = join(root, 'dist')) => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
      let file = normalize(join(directory, pathname))
      if (!file.startsWith(directory)) throw new Error('fora de dist')
      if (pathname.endsWith('/')) file = join(file, 'index.html')
      else if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html')
      const body = await readFile(file)
      response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' })
      response.end(body)
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      response.end('404')
    }
  })
  server.listen(port, () => console.log(`http://localhost:${port}`))
  return server
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) serve()
