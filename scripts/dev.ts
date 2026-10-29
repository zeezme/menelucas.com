import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from './serve'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Refaz o build num processo filho, para sempre ler `resume.json` e o CSS atualizados. */
const rebuild = (): Promise<void> =>
  new Promise((resolveBuild) => {
    const child = spawn(process.execPath, ['--import', 'tsx', join(root, 'scripts/build.ts')], {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('close', () => resolveBuild())
  })

await rebuild()
serve()

let timer: NodeJS.Timeout | undefined
for (const dir of ['src', 'content', 'public']) {
  watch(join(root, dir), { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => void rebuild(), 150)
  })
}
