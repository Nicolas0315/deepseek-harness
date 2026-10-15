/** Japanese content recall through the real SessionList API and the localized sidebar. */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { Context } from '@deepseek-ai/cordis'
import * as JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import { afterAll, beforeAll, describe, expect, it, onTestFailed, onTestFinished, vi } from 'vitest'
import { SESSION_FORMAT_VERSION, SessionId, SessionSeq } from '@deepseek-ai/dsh-session'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session-title'
import {
  assertFixtureInventory, captureStableAria, compareOrRefreshGolden, launchWebScaffold, watchConsole,
  webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, openSettings, saveFailureShot } from './support.ts'

const mode = webSnapshotMode()
const expected = fileURLToPath(new URL('./expected/session-search-japanese', import.meta.url))
const text = 'これは日本語の文章です。ｶﾞｲﾄﾞを読んでAPIを使う。葛\u{E0100}と𠮷😀。'
const id = SessionId('japanese-content-search')

describe.skipIf(mode === 'record')('web e2e: Japanese session content search', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    if (mode === 'refresh') await mkdir(expected, { recursive: true })
    scaffold = await launchWebScaffold()
    const seeder = new Context()
    try {
      await seeder.plugin(JsonlSessionPersistence, { root: scaffold.persistenceRoot })
      const writer = await seeder.sessionPersistence.create({
        version: SESSION_FORMAT_VERSION, id, createdAt: 10, isSeeded: false,
        cwd: scaffold.workspaceCwd,
      })
      try {
        await writer.append([
          { type: 'session/title', seq: SessionSeq(0), time: 10,
            data: { title: '記録01', messageSeqs: [], source: { kind: 'user' } } },
          { type: 'turn/start', seq: SessionSeq(1), time: 11, data: { turn: 1 } },
          { type: 'user/message', seq: SessionSeq(2), time: 12,
            data: createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }), surfaceOp: 'append' },
          { type: 'turn/end', seq: SessionSeq(3), time: 13, data: { turn: 1, reason: { kind: 'completed' } } },
        ])
      } finally {
        await writer.close()
      }
    } finally {
      await seeder.fiber.dispose()
    }
    expect((await scaffold.ctx.sessionQuery.listSessions()).map(record => record.header.id)).toContain(id)
    const initialHits = await scaffold.ctx.sessionQuery.searchSessions({ query: '日本語' })
    expect(initialHits.items.map(hit => hit.header.id)).toEqual([id])
    expect(initialHits.items[0]?.bestMatch.snippet).toContain(text)
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
  })

  afterAll(async () => {
    try { await browser?.close() } finally { await scaffold?.close() }
  })

  it('finds interior Japanese phrases, compatibility kana, and mixed Latin text and opens the unchanged message', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-japanese-content-search'))
    await openSettings(page, 'en')
    await page.getByRole('dialog', { name: 'Settings', exact: true }).getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('menuitem', { name: '日本語', exact: true }).click()
    await page.getByRole('dialog', { name: '設定', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'セッションを検索', exact: true }).click()
    const requests = vi.spyOn(scaffold.ctx.sessionQuery, 'searchSessions')
    onTestFinished(() => { requests.mockRestore() })
    const search = page.getByPlaceholder('セッション名を検索', { exact: true })
    const results = page.getByRole('tree', { name: '検索結果', exact: true })
    for (const term of ['日本語', '日本', '日', 'ガイド', 'ｶﾞｲﾄﾞ', 'API', 'APIを使う', '葛', '葛\u{E0100}', '𠮷']) {
      await search.fill(term)
      await expect.poll(() => requests.mock.calls.some(([request]) => request.query === term)).toBe(true)
      await page.getByRole('status', { name: 'セッション履歴を検索中…', exact: true }).waitFor({ state: 'detached' })
      const row = results.getByRole('treeitem')
      await expect.poll(() => row.count(), { timeout: 15_000 }).toBe(1)
      await expect.poll(() => row.textContent()).toContain(text)
      expect(await row.textContent()).not.toContain('日 本 語')
    }
    await search.fill('日本語')
    await expect.poll(() => results.getByRole('treeitem').count(), { timeout: 15_000 }).toBe(1)
    await compareOrRefreshGolden(join(expected, 'results.expected.md'),
      await captureStableAria(page, '[role="tree"][aria-label="検索結果"]', scaffold.workspaceCwd), mode)
    await results.getByRole('treeitem').click()
    await page.locator(`[data-conversation-session="${id}"]`).waitFor()
    await page.locator('[class*="centerCol"]').getByText(text, { exact: true }).waitFor()
    const persisted = await scaffold.ctx.sessionPersistence.open(id, 'read')
    try {
      const log = await persisted.read()
      expect(log.events.find(event => event.type === 'user/message')?.data).toMatchObject({
        content: [{ type: 'text', text }],
      })
    } finally {
      await persisted.close()
    }
    await assertFixtureInventory(expected, ['results.expected.md'])
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })
})
