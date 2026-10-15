/** A cold-seeded user message that carries a credential draws it masked behind its reveal control. */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import {
  assertFixtureInventory, compareOrRefreshGolden, fixtureUserPrompts,
  launchWebScaffold, seedSession, watchConsole, webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('../../../snapshots/web/user-text-secret-mask', import.meta.url))
// Borrowed read-only: this scenario needs any settled user message, not a new recording.
const SEED = fileURLToPath(new URL('../../../snapshots/web/seeded-history/session.v3.jsonl', import.meta.url))
const MODE = webSnapshotMode()
const RECORDED_PROMPT = 'Use the read tool twice in one assistant message: read a.txt and b.txt. Then reply with the single word DONE and stop.'
// Assembled at run time so the repository holds no literal in a credential format.
const KEY = ['sk', '-', '0123456789abcdef0123456789abcdef'].join('')
const PROMPT = `${KEY} is the key for this task.`

describe('web e2e: credential mask in user text', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    const raw = (await readFile(SEED, 'utf8')).replace(RECORDED_PROMPT, PROMPT)
    expect(fixtureUserPrompts(raw), 'adapted seed must carry the credential prompt').toContain(PROMPT)
    await seedSession(scaffold, raw, 'user-text-secret-mask')
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.locator('[role="treeitem"]').first().click()
    await page.locator('[role="treeitem"]').nth(1).click()
    await page.getByRole('button', { name: 'Show secret', exact: true }).waitFor()
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('masks the credential in the bubble and reveals it from its own control', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-user-text-secret-mask'))
    const text = page.locator('[class*="bubble"]', { has: page.locator('[data-secret]') })
    await compareOrRefreshGolden(join(SNAPSHOT_DIR, 'bubble.expected.md'), await text.ariaSnapshot(), MODE)
    expect(await text.textContent()).not.toContain(KEY)
    const run = page.locator('[data-secret]')
    // The mask marks and the control share one vertical center.
    const centers = await run.evaluate((box) => {
      const middle = (element: Element): number => {
        const rect = element.getBoundingClientRect()
        return rect.top + rect.height / 2
      }
      const [value, control] = [...box.children]
      return { mask: middle(value!.lastElementChild!), control: middle(control!) }
    })
    expect(Math.abs(centers.control - centers.mask)).toBeLessThanOrEqual(1)
    await page.evaluate(() => document.fonts.ready)
    const scale = await page.evaluate(() => window.devicePixelRatio)
    const pixels = (box: { x: number; y: number; width: number; height: number } | null) => {
      if (box === null) throw new Error('Secret text must have a visible box')
      return [box.x, box.y, box.x + box.width, box.y + box.height].map(edge => Math.round(edge * scale))
    }
    const bounds = async () => ({ run: pixels(await run.boundingBox()), bubble: pixels(await text.boundingBox()) })
    const masked = await bounds()
    await page.getByRole('button', { name: 'Show secret', exact: true }).click()
    await expect.poll(() => text.textContent()).toBe(PROMPT)
    // Separate inline runs can differ by Chromium's 1/64 CSS-pixel rounding; their painted edges stay in the same device pixels.
    expect(await bounds()).toEqual(masked)
    await run.evaluate((element) => { element.style.transform = 'translateX(1px)' })
    try { expect(await bounds()).not.toEqual(masked) }
    finally { await run.evaluate((element) => { element.style.removeProperty('transform') }) }
    expect(await bounds()).toEqual(masked)
    await page.getByRole('button', { name: 'Hide secret', exact: true }).click()
    await expect.poll(() => text.textContent()).not.toContain(KEY)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })

  it('uses Japanese reveal controls while retaining the original user text', async () => {
    await page.close()
    page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, locale: 'ja-JP', timezoneId: 'Asia/Shanghai' })
    tripwire = watchConsole(page)
    onTestFailed(() => saveFailureShot(page, 'web-e2e-user-text-secret-mask-ja'))
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.locator('[role="treeitem"]').first().click()
    await page.locator('[role="treeitem"]').nth(1).click()
    const reveal = page.getByRole('button', { name: '秘密情報を表示', exact: true })
    await reveal.waitFor()
    const text = page.locator('[class*="bubble"]', { has: page.locator('[data-secret]') })
    await compareOrRefreshGolden(join(SNAPSHOT_DIR, 'bubble-ja.expected.md'), await text.ariaSnapshot(), MODE)
    expect(await text.textContent()).not.toContain(KEY)
    await reveal.click()
    await expect.poll(() => text.textContent()).toBe(PROMPT)
    await page.getByRole('button', { name: '秘密情報を隠す', exact: true }).click()
    await expect.poll(() => text.textContent()).not.toContain(KEY)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
    await assertFixtureInventory(SNAPSHOT_DIR, ['bubble.expected.md', 'bubble-ja.expected.md'])
  })
})
