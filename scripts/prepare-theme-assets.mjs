import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 12)
await mkdir('public/fonts', { recursive: true })
const fonts = {
  she: ['src/app/fonts/cormorant-garamond-medium.woff2', 'cormorant-medium.woff2'],
  he: ['src/app/fonts/shippori-mincho/medium-latin.woff2', 'shippori-medium.woff2'],
}
const assets = {}
for (const variant of ['she', 'he']) {
  const [source, filename] = fonts[variant]
  await copyFile(source, `public/fonts/${filename}`)
  const css = await readFile(`src/app/${variant}-theme.css`, 'utf8')
  await mkdir(`public/themes/${variant}`, { recursive: true })
  await writeFile(`public/themes/${variant}/theme.css`, css)
  assets[variant] = { css: `/themes/${variant}/theme.css?v=${hash(css)}`, font: `/fonts/${filename}` }
}
await writeFile('src/lib/theme-assets.generated.json', JSON.stringify(assets, null, 2) + '\n')
