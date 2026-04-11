/**
 * Stub the auto-generated app handler registry on `npm install`.
 *
 * The bundled file at src/apps/registry.ts is gitignored — it's regenerated
 * by ../scripts/bundle-apps.sh on every CI run from the apps/*.json pointer
 * files. But the worker's src/index.ts imports from it, so a fresh clone
 * needs *something* there for `tsc --noEmit` and `wrangler dev` to work
 * before bundling has run.
 *
 * This script writes an empty stub if the file is missing. The bundler
 * overwrites it whenever it runs.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, '..', 'src', 'apps', 'registry.ts')

if (!existsSync(target)) {
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(
    target,
    `/**
 * Auto-generated app handler registry — STUB.
 * Replaced by scripts/bundle-apps.sh on every CI run.
 */

export const APP_HANDLERS: Record<string, (request: Request) => Promise<Response>> = {
}
`,
  )
  console.log('stub-registry: wrote empty src/apps/registry.ts')
}
