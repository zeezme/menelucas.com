import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from './serve'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Rebuild num processo filho para sempre ler resume.json/CSS atualizados. */
function rebuild(): Promise<void> {
  return new Promise((done) => {
    const child = spawn(process.execPath, ['--import', 'tsx', join(root, 'scripts/build.ts')], {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('close', () => done())
  })
}

await rebuild()
serve()

let timer: NodeJS.Timeout | undefined
for (const dir of ['src', 'content', 'public']) {
  watch(join(root, dir), { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => void rebuild(), 150)
  })
}
