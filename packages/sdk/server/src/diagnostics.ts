/** Fixed SDK server diagnostics; interpolated runtime values remain verbatim. */
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const en = {
  attachments: () => 'SDK image prompt requires an attachment store',
  effort: () => 'initialize reasoningEffort must be a non-empty string',
  maxTokens: () => 'initialize maxTokens must be a positive safe integer',
  provider: (provider: string) => `no adapter registered for provider "${provider}"`,
  notInitialized: () => 'SDK server is not initialized',
  resumeId: () => 'session/resume requires a non-empty sessionId string',
  sessionOpen: (id: string) => `SDK session is already open or opening: ${id}`,
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
  resumeId: () => 'session/resume には空でない文字列の sessionId が必要です',
  sessionOpen: (id: string) => `SDK セッションはすでに開かれているか、復元中です: ${id}`,
  unknownSession: (id: string) => `不明な SDK セッションです: ${id}`,
  disposed: (id: string) => `セッションのエージェントがサーバーの外部で破棄されました: ${id}`,
  cleanup: () => 'SDK サーバーの後処理が失敗しました',
  waitId: () => 'session/wait には文字列の sessionId が必要です',
  directoryId: () => 'working-directory リクエストには空でない sessionId が必要です',
  directoryPath: () => 'working-directory set には文字列の path が必要です',
  method: (method: string) => `不明な DeepSeek Harness SDK ランタイムメソッドです: ${method}`,
  shuttingDown: () => 'SDK サーバーは終了処理中です',
} satisfies typeof en

const zh = {
  attachments: () => 'SDK 图像提示需要附件存储',
  effort: () => 'initialize 的 reasoningEffort 必须是非空字符串',
  maxTokens: () => 'initialize 的 maxTokens 必须是正安全整数',
  provider: (provider: string) => `没有为提供方“${provider}”注册适配器`,
  notInitialized: () => 'SDK 服务器未初始化',
  resumeId: () => 'session/resume 需要非空字符串 sessionId',
  sessionOpen: (id: string) => `SDK 会话已打开或正在恢复：${id}`,
  unknownSession: (id: string) => `未知 SDK 会话：${id}`,
  disposed: (id: string) => `会话代理已在服务器外释放：${id}`,
  cleanup: () => 'SDK 服务器清理失败',
  waitId: () => 'session/wait 需要字符串 sessionId',
  directoryId: () => 'working-directory 请求需要非空 sessionId',
  directoryPath: () => 'working-directory set 需要字符串 path',
  method: (method: string) => `未知 DeepSeek Harness SDK 运行时方法：${method}`,
  shuttingDown: () => 'SDK 服务器正在关闭',
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
