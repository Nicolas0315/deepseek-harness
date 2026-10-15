/** Japanese settings, native IME composition, and original workspace paths in the assembled Web app. */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed, onTestFinished } from 'vitest'
import {
  assertFixtureInventory, captureStableAria, compareOrRefreshGolden, launchWebScaffold, watchConsole,
  webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage, openSettings, saveFailureShot, writeComposerDraft } from './support.ts'

const mode = webSnapshotMode()
const expected = fileURLToPath(new URL('./expected/japanese-compatibility', import.meta.url))
const workspace = '日本語の作業場所'
const decomposedName = 'カ\u3099イド.txt'

describe.skipIf(mode === 'record')('web e2e: Japanese compatibility', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    if (mode === 'refresh') await mkdir(expected, { recursive: true })
    scaffold = await launchWebScaffold()
    const cwd = join(scaffold.workspaceCwd, workspace)
    await mkdir(cwd)
    for (const name of ['資料10.txt', '資料2.txt', decomposedName, '一.txt', '安.txt', '愛.txt', '亜.txt']) {
      await writeFile(join(cwd, name), `日本語ファイル：${name}\n内容をそのまま表示します。\n`)
    }
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await connectFreshWorkspace(page, scaffold.workspaceCwd, workspace)
  })

  afterAll(async () => {
    try { await browser?.close() } finally { await scaffold?.close() }
  })

  it('preserves confirmed Japanese text, suppresses composing Enter, and opens Japanese filenames in natural order', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-japanese-compatibility'))
    await openSettings(page, 'en')
    const settings = page.getByRole('dialog', { name: 'Settings', exact: true })
    await settings.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('menuitem', { name: '日本語', exact: true }).click()
    await page.getByRole('dialog', { name: '設定', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('ja')
    await expect.poll(() => scaffold.ctx.settings.describe().find(row => row.ns === 'locale')?.value)
      .toEqual({ preference: 'ja' })

    const defaultFont = await page.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--dsh-font-family-text-default'))
    expect(defaultFont).toContain('Yu Gothic UI')
    expect(defaultFont.indexOf('Yu Gothic UI')).toBeLessThan(defaultFont.indexOf('PingFang SC'))
    expect(defaultFont.indexOf('Yu Gothic UI')).toBeLessThan(defaultFont.indexOf('Microsoft YaHei'))
    const previousFont = await page.evaluate(() => document.body.style.getPropertyValue('--dsh-font-family-text'))
    onTestFinished(async () => {
      await scaffold.ctx.settings.update('ui-theme', { textFontFamily: previousFont })
      await expect.poll(() => page.evaluate(() => document.body.style.getPropertyValue('--dsh-font-family-text'))).toBe(previousFont)
    })
    await scaffold.ctx.settings.update('ui-theme', { textFontFamily: 'Japanese Acceptance Font, serif' })
    await expect.poll(() => page.evaluate(() => document.body.style.getPropertyValue('--dsh-font-family-text')))
      .toBe('"Japanese Acceptance Font", serif')
    expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--dsw-font-family')))
      .toMatch(/^"Japanese Acceptance Font", serif,/)


    const input = page.locator('[data-composer-input]').first()
    await writeComposerDraft(page, input, '')
    let submittedMessages = 0
    const unwatch = scaffold.ctx.on('session/event', (_session, event) => {
      if (event.type === 'user/message') submittedMessages += 1
    })
    onTestFinished(() => { unwatch() })
    const keys: Array<{ key: string; composing: boolean }> = []
    await page.exposeFunction('observeJapaneseKey', (event: { key: string; composing: boolean }) => { keys.push(event) })
    await input.evaluate((element) => {
      const observed = globalThis as typeof globalThis & {
        observeJapaneseKey(event: { key: string; composing: boolean }): Promise<void>
      }
      element.addEventListener('keydown', (event) => {
        const key = event as KeyboardEvent
        void observed.observeJapaneseKey({ key: key.key, composing: key.isComposing })
      })
    })
    const cdp = await page.context().newCDPSession(page)
    try {
      await input.focus()
      await cdp.send('Input.imeSetComposition', { text: 'にほんご', selectionStart: 4, selectionEnd: 4 })
      await expect.poll(() => input.getAttribute('data-composer-composing')).toBe('')
      await input.press('Enter')
      await expect.poll(() => keys.some(event => event.key === 'Enter' && event.composing)).toBe(true)
      expect(submittedMessages).toBe(0)
      // Enter may confirm the first composition in Chromium. Start a new
      // composition to exercise committed text without appending to that draft.
      await writeComposerDraft(page, input, '')
      await cdp.send('Input.imeSetComposition', { text: '日本語の入力', selectionStart: 6, selectionEnd: 6 })
      await cdp.send('Input.insertText', { text: '日本語の入力' })
      await expect.poll(() => input.textContent()).toBe('日本語の入力')
      await expect.poll(() => input.getAttribute('data-composer-composing')).toBeNull()
      expect(submittedMessages).toBe(0)
      await compareOrRefreshGolden(join(expected, 'composer.expected.md'),
        await captureStableAria(page, '[data-composer-input]', scaffold.workspaceCwd), mode)
    } finally {
      await cdp.detach()
    }

    await writeComposerDraft(page, input, '@カ\u3099イド')
    const suggestions = page.getByRole('listbox', { name: '候補を表示' })
    const file = suggestions.getByRole('option').filter({ hasText: decomposedName })
    await file.waitFor()
    await file.click()
    await expect.poll(() => input.textContent()).toContain(decomposedName)
    await writeComposerDraft(page, input, '')

    await page.locator('[data-sidebar-right-expand]').click()
    await page.locator('[data-sidebar-right-guide-entry="files"]').click()
    const files = page.locator('[data-files-state="tree"]')
    await expect.poll(() => files.locator('[data-files-entry="file"] button').allTextContents())
      .toEqual([decomposedName, '亜.txt', '愛.txt', '安.txt', '一.txt', '資料2.txt', '資料10.txt'])
    expect(await files.locator('[data-files-entry="file"]').evaluateAll(elements =>
      elements.map(element => element.getAttribute('data-files-path'))))
      .toEqual([decomposedName, '亜.txt', '愛.txt', '安.txt', '一.txt', '資料2.txt', '資料10.txt'].map(name => join(scaffold.workspaceCwd, workspace, name)))
    await compareOrRefreshGolden(join(expected, 'files.expected.md'),
      await captureStableAria(page, '[data-files-state="tree"]', scaffold.workspaceCwd), mode)
    await files.getByRole('button', { name: decomposedName, exact: true }).click()
    await page.locator('[data-sidebar-right-panel]').getByText(`日本語ファイル：${decomposedName}`, { exact: false }).waitFor()
    await page.locator('[data-sidebar-right-panel]').getByText('内容をそのまま表示します。', { exact: false }).waitFor()
    expect(submittedMessages).toBe(0)
    await assertFixtureInventory(expected, ['composer.expected.md', 'files.expected.md'])
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })
})
