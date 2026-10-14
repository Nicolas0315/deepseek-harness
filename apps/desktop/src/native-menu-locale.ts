/** Electron roles with source-owned labels in every Desktop locale. */
const nativeMenuRoles = [
  'editMenu', 'windowMenu', 'undo', 'redo', 'cut', 'copy', 'paste', 'pasteAndMatchStyle', 'delete', 'selectAll',
  'showSubstitutions', 'toggleSmartQuotes', 'toggleSmartDashes', 'toggleTextReplacement', 'startSpeaking', 'stopSpeaking',
  'minimize', 'zoom', 'front', 'emoji',
] as const

type NativeMenuRole = (typeof nativeMenuRoles)[number]

/** Localized labels for Electron's built-in macOS menu roles. */
type NativeMenuMessages = {
  readonly roles: Readonly<Record<NativeMenuRole, string>>
  readonly substitutions: string
  readonly speech: string
}

type NativeMenuItem = {
  label: string
  role?: string | null
  submenu?: NativeMenu | null
}

/** Minimal mutable Electron Menu surface used after default roles expand. */
export type NativeMenu = { items: NativeMenuItem[] }

const en: NativeMenuMessages = {
  roles: {
    editMenu: 'Edit', windowMenu: 'Window', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste',
    pasteAndMatchStyle: 'Paste and Match Style', delete: 'Delete', selectAll: 'Select All',
    showSubstitutions: 'Show Substitutions', toggleSmartQuotes: 'Smart Quotes', toggleSmartDashes: 'Smart Dashes',
    toggleTextReplacement: 'Text Replacement', startSpeaking: 'Start Speaking', stopSpeaking: 'Stop Speaking',
    minimize: 'Minimize', zoom: 'Zoom', front: 'Bring All to Front', emoji: 'Emoji & Symbols',
  },
  substitutions: 'Substitutions',
  speech: 'Speech',
}

const zh: NativeMenuMessages = {
  roles: {
    editMenu: '编辑', windowMenu: '窗口', undo: '撤销', redo: '重做', cut: '剪切', copy: '复制', paste: '粘贴',
    pasteAndMatchStyle: '粘贴并匹配样式', delete: '删除', selectAll: '全选',
    showSubstitutions: '显示替换', toggleSmartQuotes: '智能引号', toggleSmartDashes: '智能破折号',
    toggleTextReplacement: '文本替换', startSpeaking: '开始朗读', stopSpeaking: '停止朗读',
    minimize: '最小化', zoom: '缩放', front: '全部移到最前', emoji: '表情与符号',
  },
  substitutions: '替换',
  speech: '语音',
}

const ja: NativeMenuMessages = {
  roles: {
    editMenu: '編集', windowMenu: 'ウィンドウ', undo: '取り消す', redo: 'やり直す', cut: '切り取り', copy: 'コピー', paste: '貼り付け',
    pasteAndMatchStyle: 'ペーストしてスタイルを合わせる', delete: '削除', selectAll: 'すべて選択',
    showSubstitutions: '置換を表示', toggleSmartQuotes: 'スマート引用符', toggleSmartDashes: 'スマートダッシュ',
    toggleTextReplacement: 'テキスト置換', startSpeaking: '読み上げを開始', stopSpeaking: '読み上げを停止',
    minimize: '最小化', zoom: '拡大', front: 'すべてを手前に移動', emoji: '絵文字と記号',
  },
  substitutions: '置換',
  speech: '読み上げ',
}

const messages = { en, 'zh-CN': zh, 'ja-JP': ja } as const

function hasChildRole(menu: NativeMenu, role: string): boolean {
  return menu.items.some(item => item.role?.toLowerCase() === role)
}

function nativeMenuRole(role: string | null | undefined): NativeMenuRole | undefined {
  if (role === null || role === undefined) return undefined
  return nativeMenuRoles.find(candidate => candidate.toLowerCase() === role.toLowerCase())
}

/**
 * Relabel default Electron menu roles after their native submenus expand.
 * @param menu - Electron-built application menu, including role-generated children.
 * @param locale - Selected Desktop locale.
 */
export function localizeNativeMenu(menu: NativeMenu, locale: keyof typeof messages): void {
  const selected = messages[locale]
  for (const item of menu.items) {
    const role = nativeMenuRole(item.role)
    if (role !== undefined) item.label = selected.roles[role]
    if (item.submenu !== null && item.submenu !== undefined) {
      localizeNativeMenu(item.submenu, locale)
      if (hasChildRole(item.submenu, 'showsubstitutions')) item.label = selected.substitutions
      if (hasChildRole(item.submenu, 'startspeaking')) item.label = selected.speech
    }
  }
}
