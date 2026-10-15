import { describe, expect, it } from 'vitest'
import { localizeNativeMenu } from '../src/native-menu-locale.ts'

type NativeMenuItem = {
  label: string
  role?: string | null
  submenu?: NativeMenu | null
}

type NativeMenu = { items: NativeMenuItem[] }

function nativeMenu(): NativeMenu {
  return { items: [
    { label: 'Edit', role: 'editmenu', submenu: { items: [
      { label: 'Undo', role: 'undo' },
      { label: 'Redo', role: 'redo' },
      { label: '', role: null, submenu: null },
      { label: 'Cut', role: 'cut' },
      { label: 'Copy', role: 'copy' },
      { label: 'Paste', role: 'paste' },
      { label: 'Paste and Match Style', role: 'pasteandmatchstyle' },
      { label: 'Delete', role: 'delete' },
      { label: 'Select All', role: 'selectall' },
      { label: 'Substitutions', submenu: { items: [
        { label: 'Show Substitutions', role: 'showsubstitutions' },
        { label: 'Smart Quotes', role: 'togglesmartquotes' },
        { label: 'Smart Dashes', role: 'togglesmartdashes' },
        { label: 'Text Replacement', role: 'toggletextreplacement' },
      ] } },
      { label: 'Speech', submenu: { items: [
        { label: 'Start Speaking', role: 'startspeaking' },
        { label: 'Stop Speaking', role: 'stopspeaking' },
      ] } },
      { label: 'Emoji & Symbols', role: 'emoji' },
      { label: 'Dictation…', role: null },
    ] } },
    { label: 'Window', role: 'windowmenu', submenu: { items: [
      { label: 'Minimize', role: 'minimize' },
      { label: 'Zoom', role: 'zoom' },
      { label: 'Bring All to Front', role: 'front' },
    ] } },
  ] }
}

function itemAt(items: readonly NativeMenuItem[], index: number): NativeMenuItem {
  const item = items[index]
  if (item === undefined) throw new Error(`missing fixture item ${index}`)
  return item
}

function submenuOf(item: NativeMenuItem): NativeMenu {
  if (item.submenu === undefined || item.submenu === null) throw new Error(`missing fixture submenu ${item.label}`)
  return item.submenu
}

describe('native application menu locale', () => {
  it('relabels Electron default Edit and Window roles in Japanese without removing OS items', () => {
    const menu = nativeMenu()

    localizeNativeMenu(menu, 'ja-JP')

    const edit = itemAt(menu.items, 0)
    const editItems = submenuOf(edit).items
    const substitutions = itemAt(editItems, 9)
    const speech = itemAt(editItems, 10)
    const window = itemAt(menu.items, 1)
    expect(edit.label).toBe('編集')
    expect(editItems.map(item => item.label)).toEqual([
      '取り消す', 'やり直す', '', '切り取り', 'コピー', '貼り付け', 'ペーストしてスタイルを合わせる', '削除', 'すべて選択',
      '置換', '読み上げ', '絵文字と記号', 'Dictation…',
    ])
    expect(submenuOf(substitutions).items.map(item => item.label)).toEqual([
      '置換を表示', 'スマート引用符', 'スマートダッシュ', 'テキスト置換',
    ])
    expect(submenuOf(speech).items.map(item => item.label)).toEqual(['読み上げを開始', '読み上げを停止'])
    expect(window.label).toBe('ウィンドウ')
    expect(submenuOf(window).items.map(item => item.label)).toEqual(['最小化', '拡大', 'すべてを手前に移動'])
  })

  it('relabels the same constructed menu as the language changes', () => {
    const menu = nativeMenu()

    localizeNativeMenu(menu, 'ja-JP')
    localizeNativeMenu(menu, 'zh-CN')
    const edit = itemAt(menu.items, 0)
    const editItems = submenuOf(edit).items
    const window = itemAt(menu.items, 1)
    expect(edit.label).toBe('编辑')
    expect(itemAt(editItems, 9).label).toBe('替换')
    expect(itemAt(editItems, 11).label).toBe('表情与符号')
    expect(window.label).toBe('窗口')
    localizeNativeMenu(menu, 'en')

    expect(edit.label).toBe('Edit')
    expect(itemAt(editItems, 9).label).toBe('Substitutions')
    expect(itemAt(editItems, 10).label).toBe('Speech')
    expect(itemAt(editItems, 11).label).toBe('Emoji & Symbols')
    expect(window.label).toBe('Window')
  })
})
