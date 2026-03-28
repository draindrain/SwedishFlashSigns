/**
 * Scraper for Swedish traffic signs from Transportstyrelsen.
 * Run with: npx tsx scripts/scrape-signs.ts
 *
 * Outputs:
 *  - public/data/images/{id}.png   — downloaded sign images
 *  - src/data/signs.ts             — updated SIGNS array + interface
 */

import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const BASE_URL = 'https://www.transportstyrelsen.se'
const LISTING_URL =
  'https://www.transportstyrelsen.se/sv/vagtrafik/trafikregler-och-vagmarken/vagmarken/'

const IMAGES_DIR = path.resolve('public/data/images')
const SIGNS_FILE = path.resolve('src/data/signs.ts')

interface ScrapedSign {
  id: string
  name: string
  category: string
  categoryName: string
  imageUrl: string | null
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    proto
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          fs.unlink(dest, () => {})
          downloadFile(res.headers.location!, dest).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          file.close()
          fs.unlink(dest, () => {})
          reject(new Error(`HTTP ${res.statusCode} for ${url}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
  })
}

function extractCategory(id: string): string {
  const match = id.match(/^([A-Z]+)/)
  return match ? match[1] : id
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  console.log('Fetching category listing…')
  await page.goto(LISTING_URL, { waitUntil: 'networkidle' })

  // .roadsign-item IS the <a> element on the listing page
  const catLinks = await page.$$('a.roadsign-item')
  console.log(`Found ${catLinks.length} category elements.`)

  const categories: { url: string; letter: string; name: string }[] = []
  for (const link of catLinks) {
    const href = await link.getAttribute('href')
    if (!href) continue

    const textEl = await link.$('.roadsign-text')
    const rawText = textEl ? (await textEl.innerText()).trim() : ''
    // e.g. "A.\n Varningsmärken" → letter="A", name="Varningsmärken"
    const parts = rawText.split(/[\n.]+/).map((s) => s.trim()).filter(Boolean)
    const letter = parts[0] ?? ''
    const name = parts.slice(1).join(' ') || rawText

    const fullUrl = href.startsWith('http') ? href : BASE_URL + href
    categories.push({ url: fullUrl, letter, name })
  }

  console.log(`Parsed ${categories.length} categories.`)

  const allSigns: ScrapedSign[] = []

  for (const cat of categories) {
    console.log(`\nCategory ${cat.letter}: ${cat.name}`)
    await page.goto(cat.url, { waitUntil: 'networkidle' })

    // On a category page, sign items are also a.roadsign-item
    const signLinks = await page.$$('a.roadsign-item')
    console.log(`  Found ${signLinks.length} signs`)

    const signData: { url: string; rawText: string }[] = []
    for (const link of signLinks) {
      const href = await link.getAttribute('href')
      if (!href) continue

      const textEl = await link.$('.roadsign-text')
      const rawText = textEl ? (await textEl.innerText()).trim() : ''
      const fullUrl = href.startsWith('http') ? href : BASE_URL + href
      signData.push({ url: fullUrl, rawText })
    }

    for (const { url: signUrl, rawText } of signData) {
      // Parse ID and name from list text: "A1. Varning för farlig kurva"
      const dotIdx = rawText.indexOf('.')
      const idFromList = dotIdx > 0 ? rawText.slice(0, dotIdx).trim() : ''
      const nameFromList = dotIdx > 0 ? rawText.slice(dotIdx + 1).trim() : rawText

      let id = idFromList.replace(/\s+/g, '')
      let name = nameFromList
      let imageUrl: string | null = null

      try {
        await page.goto(signUrl, { waitUntil: 'networkidle' })

        // Try to get ID from #PageCode
        const codeEl = await page.$('#PageCode')
        if (codeEl) {
          const codeText = (await codeEl.innerText()).trim().replace(/\s+/g, '')
          if (codeText) id = codeText
        }

        // Try to get name from #PageHeader
        const headerEl = await page.$('#PageHeader')
        if (headerEl) {
          const headerText = (await headerEl.innerText()).trim()
          if (headerText) name = headerText
        }

        // Try image from .roadsign-image-sizing-wrapper img
        const imgEl = await page.$('.roadsign-image-sizing-wrapper img')
        if (imgEl) {
          const src = await imgEl.getAttribute('src')
          if (src) imageUrl = src.startsWith('http') ? src : BASE_URL + src
        }

        // Fallback: download button
        if (!imageUrl) {
          const dlBtn = await page.$('.btn.roadsign-button[download]')
          if (dlBtn) {
            const href = await dlBtn.getAttribute('href')
            if (href) imageUrl = href.startsWith('http') ? href : BASE_URL + href
          }
        }
      } catch (err) {
        console.warn(`  Warning: failed to fetch detail page for ${id}: ${err}`)
      }

      if (!id) {
        console.warn(`  Skipping sign with no ID (url: ${signUrl})`)
        continue
      }

      allSigns.push({
        id,
        name,
        category: extractCategory(id),
        categoryName: cat.name,
        imageUrl,
      })

      // Download image
      if (imageUrl) {
        const imgPath = path.join(IMAGES_DIR, `${id}.png`)
        if (!fs.existsSync(imgPath)) {
          try {
            await downloadFile(imageUrl, imgPath)
            process.stdout.write(`  Downloaded ${id}.png\n`)
          } catch (err) {
            console.warn(`  Failed to download image for ${id}: ${err}`)
          }
        } else {
          process.stdout.write(`  Skipped ${id}.png (already exists)\n`)
        }
      } else {
        console.warn(`  No image URL found for ${id}`)
      }
    }
  }

  await browser.close()

  console.log(`\nScraped ${allSigns.length} signs total.`)
  generateSignsFile(allSigns)
  console.log(`Wrote ${SIGNS_FILE}`)
}

function generateSignsFile(signs: ScrapedSign[]) {
  // Group by category, preserving order
  const seenCategories: string[] = []
  const byCategory = new Map<string, ScrapedSign[]>()
  for (const s of signs) {
    if (!byCategory.has(s.category)) {
      seenCategories.push(s.category)
      byCategory.set(s.category, [])
    }
    byCategory.get(s.category)!.push(s)
  }

  const lines: string[] = []
  lines.push(`export interface TrafficSign {`)
  lines.push(`  id: string`)
  lines.push(`  name: string`)
  lines.push(`  category: string`)
  lines.push(`  categoryName: string`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export function getImageUrl(id: string): string {`)
  lines.push(`  return \`\${import.meta.env.BASE_URL}data/images/\${id}.png\``)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export const SIGNS: TrafficSign[] = [`)

  for (const cat of seenCategories) {
    const catSigns = byCategory.get(cat)!
    const catName = catSigns[0].categoryName
    lines.push(`  // ── ${cat}: ${catName}`)
    for (const s of catSigns) {
      const name = s.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      lines.push(
        `  { id: '${s.id}', name: '${name}', category: '${s.category}', categoryName: '${catName}' },`,
      )
    }
    lines.push(``)
  }

  lines.push(`]`)
  lines.push(``)

  fs.writeFileSync(SIGNS_FILE, lines.join('\n'), 'utf-8')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
