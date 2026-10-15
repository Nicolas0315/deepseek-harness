// @vitest-environment jsdom
/** Read-only workbook messages and accessible controls use the Japanese dictionary in both published entries. */
import { createRequire } from 'node:module'
import { defaultContext, locale } from '@fortune-sheet/core'
import { expect, it } from 'vitest'

const commonJs = createRequire(import.meta.url)('@fortune-sheet/core') as typeof import('@fortune-sheet/core')

it.each([
  ['ESM', locale],
  ['CommonJS', commonJs.locale],
] as const)('localizes read-only workbook controls and announcements through the %s entry', (_entry, translate) => {
  const context = defaultContext({
    globalCache: { undoList: [], redoList: [] },
    cellInput: { current: null }, fxInput: { current: null }, canvas: { current: null },
    cellArea: { current: null }, workbookContainer: { current: null },
  })
  context.allowEdit = false
  context.lang = 'ja-JP'
  const japanese = translate(context)
  expect(japanese.info.currentCellInput).toBe('現在のセルの内容')
  expect(japanese.info.zoomIn).toBe('拡大')
  expect(japanese.info.zoomOut).toBe('縮小')
  expect(japanese.info.zoomSettings).toBe('表示倍率の設定')
  expect(japanese.info.copyShortcut).toBe('コピー：Control または Meta キー、C。')
  expect(japanese.rightclick.copy).toBe('コピー')
  expect(japanese.rightclick.noMulti).toBe('複数の選択範囲には実行できません。単一の範囲を選択してください。')
  expect(japanese.generalDialog.readOnlyError).toBe('読み取り専用ではこの操作を実行できません')
  expect(japanese.button.confirm).toBe('OK')
  expect(japanese.button.cancel).toBe('キャンセル')
  expect(japanese.findAndReplace.find).toBe('検索')
  expect(japanese.insertLink.openLink).toBe('リンクを開く')
  context.lang = 'ja'
  expect(translate(context)).toBe(japanese)
  context.lang = 'en-US'
  const english = translate(context)
  for (const group of ['info', 'generalDialog', 'button', 'findAndReplace', 'insertLink', 'comment'] as const) {
    expect(Object.keys(japanese[group])).toEqual(Object.keys(english[group]))
    const translatedGroup: Readonly<Record<string, string>> = japanese[group]
    for (const [key, original] of Object.entries(english[group])) {
      const translated = translatedGroup[key]
      if (original !== '' && original !== 'OK') expect(translated, `${group}.${key}`).not.toBe(original)
    }
  }
  context.lang = 'fr-FR'
  expect(translate(context)).toBe(english)
})
