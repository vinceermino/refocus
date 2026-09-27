import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const variants = { she: { color: '#fdfbf7', source: 'sakura' }, he: { color: '#1a1d1c', source: 'enso' } }
for (const [variant, { color, source }] of Object.entries(variants)) {
  const directory = `public/icons/${variant}`
  await mkdir(directory, { recursive: true })
  const svg = await readFile(`public/themes/${variant}/${source}.svg`)
  const background = variant === 'she' ? '#fdfbf7' : '#f4f1ea'
  for (const size of [180, 192, 256, 384, 512]) {
    // Artwork stays inside the central safe area, including circular masks.
    const artwork = await sharp(svg).resize(Math.round(size * .7), Math.round(size * .7), { fit: 'contain', background: 'transparent' }).png().toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([{ input: artwork, gravity: 'centre' }]).png().toFile(`${directory}/${size}.png`)
  }
  const manifest = {
    id: '/', name: `ReFocus · ${variant === 'she' ? 'She' : 'He'}`, short_name: 'ReFocus',
    description: 'A quiet space for focused study, on your own or together.',
    lang: 'en', start_url: '/', scope: '/', display: 'standalone',
    background_color: color, theme_color: color,
    icons: [192, 256, 384, 512].map(size => ({ src: `/icons/${variant}/${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
  }
  manifest.icons.push({ src: `/icons/${variant}/512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' })
  await writeFile(`public/manifest-${variant}.webmanifest`, JSON.stringify(manifest, null, 2) + '\n')
}
// Stable default for crawlers; the document selects the saved variant.
await writeFile('public/manifest.webmanifest', await readFile('public/manifest-he.webmanifest'))
