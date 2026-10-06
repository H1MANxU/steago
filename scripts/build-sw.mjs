// Runs after `next build` (static export). Lists every file in out/ that makes up
// the app shell and writes it into out/sw.js as the precache manifest.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, sep } from 'node:path'

const OUT = 'out'
const EXCLUDE = [/^models\/perch.*\.onnx$/, /^sw\.js$/, /\.map$/, /^placeholder/, /\.txt$/]

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(OUT)
  .map((f) => relative(OUT, f).split(sep).join('/'))
  .filter((f) => !EXCLUDE.some((re) => re.test(f)))
  .sort()

const hash = createHash('sha256')
for (const f of files) hash.update(f).update(readFileSync(join(OUT, f)))
const version = hash.digest('hex').slice(0, 12)

const urls = files.map((f) => (f === 'index.html' ? '/' : `/${f.replace(/index\.html$/, '')}`))
const template = readFileSync('public/sw.js', 'utf8')
const output = template
  .replace('self.__PRECACHE_VERSION__', JSON.stringify(version))
  .replace('self.__PRECACHE_MANIFEST__', JSON.stringify(urls))

writeFileSync(join(OUT, 'sw.js'), output)
console.log(`Service worker: ${urls.length} files precached (version ${version})`)
