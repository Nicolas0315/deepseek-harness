/** Fixed SDK server diagnostics; interpolated runtime values remain verbatim. */
import { resolveDiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const en = {
  attachments: () => 'SDK image prompt requires an attachment store',
  effort: () => 'initialize reasoningEffort must be a non-empty string',
  maxTokens: () => 'initialize maxTokens must be a positive safe integer',
  provider: (provider: string) => `no adapter registered for provider "${provider}"`,
  notInitialized: () => 'SDK server is not initialized',
  unknownSession: (id: string) => `unknown SDK session: ${id}`,
  disposed: (id: string) => `session agent was disposed outside the server: ${id}`,
  cleanup: () => 'SDK server teardown failed',
  waitId: () => 'session/wait requires a sessionId string',
  directoryId: () => 'working-directory requests require a non-empty sessionId',
  directoryPath: () => 'working-directory set requires a path string',
  method: (method: string) => `unknown DeepSeek Harness SDK runtime method: ${method}`,
  shuttingDown: () => 'SDK server is shutting down',
}

const ja = {
  attachments: () => 'SDK の画像プロンプトには添付ファイルストアが必要です',
  effort: () => 'initialize の reasoningEffort は空でない文字列である必要があります',
  maxTokens: () => 'initialize の maxTokens は正の安全な整数である必要があります',
  provider: (provider: string) => `プロバイダー "${provider}" のアダプターが登録されていません`,
  notInitialized: () => 'SDK サーバーが初期化されていません',
  unknownSession: (id: string) => `不明な SDK セッションです: ${id}`,
  disposed: (id: string) => `セッションのエージェントがサーバーの外部で破棄されました: ${id}`,
  cleanup: () => 'SDK サーバーの後処理が失敗しました',
  waitId: () => 'session/wait には文字列の sessionId が必要です',
  directoryId: () => 'working-directory リクエストには空でない sessionId が必要です',
  directoryPath: () => 'working-directory set には文字列の path が必要です',
  method: (method: string) => `不明な DeepSeek Harness SDK ランタイムメソッドです: ${method}`,
  shuttingDown: () => 'SDK サーバーは終了処理中です',
} satisfies typeof en

/** Fixed diagnostics indexed by the captured instance language. */
export const diagnostics = { en, ja }

/**
 * Resolve standalone helper diagnostics from the current environment.
 * @returns the selected diagnostic language.
 */
export function defaultDiagnosticLocale(): 'en' | 'ja' {
  return resolveDiagnosticLocale(process.env, Intl.DateTimeFormat().resolvedOptions().locale)
}
