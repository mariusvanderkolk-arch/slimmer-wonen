// Genereert PWA-iconen en favicon uit het logo-merk.
import sharp from 'sharp'
import fs from 'node:fs'

const merk = fs.readFileSync('public/logo-mark.svg', 'utf8')
const binnen = merk.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

/** Icoon: beige achtergrond met het gouden huis. schaal = aandeel van het merk. */
function icoon({ rond = true, schaal = 0.7 } = {}) {
  const s = 512
  const m = s * schaal
  const off = (s - m) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F3EA"/><stop offset="1" stop-color="#EADFCC"/></linearGradient></defs>
  <rect width="${s}" height="${s}" rx="${rond ? 112 : 0}" fill="url(#bg)"/>
  <rect x="10" y="10" width="${s - 20}" height="${s - 20}" rx="${rond ? 104 : 0}" fill="none" stroke="#D9C7A4" stroke-opacity="${rond ? 0.7 : 0}" stroke-width="3"/>
  <g transform="translate(${off} ${off - s * 0.01}) scale(${m / 64})">${binnen}</g>
</svg>`
}

fs.mkdirSync('public/icons', { recursive: true })
const maak = (svg, size, out) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
await maak(icoon(), 192, 'public/icons/icon-192.png')
await maak(icoon(), 512, 'public/icons/icon-512.png')
await maak(icoon({ rond: false, schaal: 0.56 }), 512, 'public/icons/maskable-512.png')
await maak(icoon({ rond: false, schaal: 0.66 }), 180, 'public/icons/apple-touch-icon.png')
await maak(icoon({ schaal: 0.8 }), 32, 'public/icons/favicon-32.png')
fs.writeFileSync('public/favicon.svg', icoon({ schaal: 0.8 }))
console.log('iconen klaar')
