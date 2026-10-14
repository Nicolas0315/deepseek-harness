/** Fixed SDK protocol diagnostics; interpolated runtime values remain verbatim. */
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const en = {
  closed: () => 'JSON-RPC transport closed',
  inputClosed: () => 'JSON-RPC input closed',
  method: (method: string) => `method not found: ${method}`,
  error: () => 'JSON-RPC error',
  aborted: (reason: string) => `JSON-RPC request aborted: ${reason}`,
}

const ja = {
  closed: () => 'JSON-RPC トランスポートを閉じました',
  inputClosed: () => 'JSON-RPC 入力を閉じました',
  method: (method: string) => `メソッドが見つかりません: ${method}`,
  error: () => 'JSON-RPC エラー',
  aborted: (reason: string) => `JSON-RPC リクエストを中止しました: ${reason}`,
} satisfies typeof en

const zh = {
  closed: () => 'JSON-RPC 传输已关闭',
  inputClosed: () => 'JSON-RPC 输入已关闭',
  method: (method: string) => `未找到方法：${method}`,
  error: () => 'JSON-RPC 错误',
  aborted: (reason: string) => `JSON-RPC 请求已中止：${reason}`,
} satisfies typeof en

/** Fixed diagnostics indexed by the captured instance language. */
export const diagnostics = { en, zh, ja }

/**
 * Resolve standalone helper diagnostics from the current environment.
 * @returns the selected diagnostic language.
 */
export function defaultDiagnosticLocale(): DiagnosticLocale {
  return resolveDiagnosticLocale(process.env, Intl.DateTimeFormat().resolvedOptions().locale)
}
