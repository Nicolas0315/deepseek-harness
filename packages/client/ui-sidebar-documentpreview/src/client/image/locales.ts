import { zoomEn, zoomJa, zoomZh } from '../zoom/locales.ts'

/** Locale-owned image renderer labels and status text. */
export const zh = {
  ...zoomZh,
  title: '图片',
  preview: '图片预览：{name}',
  loading: '文档渲染中...',
  failed: '无法显示这张图片',
  unsupported: '图片预览需要完整文件内容',
} satisfies Record<string, string>

/** Image renderer dictionary keys. */
export type ImagePreviewKey = keyof typeof zh

/** English dictionary with the same keys as the Chinese dictionary. */
export const en = {
  ...zoomEn,
  title: 'Image',
  preview: 'Image preview: {name}',
  loading: 'Rendering document...',
  failed: 'This image could not be displayed.',
  unsupported: 'Image preview requires the complete file contents.',
} satisfies Record<ImagePreviewKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Image preview selection, accessible name, and status text. */
    sidebarImage: ImagePreviewKey
  }
}

/** Japanese dictionary, checked against the complete source key set. */
export const ja: Record<keyof typeof en, string> = {
  'title': '画像',
  'preview': '画像のプレビュー：{name}',
  'loading': '文書を表示中…',
  'failed': 'この画像を表示できませんでした。',
  'unsupported': '画像のプレビューにはファイル全体の内容が必要です。',
  ...zoomJa,
}
