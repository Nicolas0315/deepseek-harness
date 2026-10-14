/** Fixed SDK client diagnostics; interpolated runtime values remain verbatim. */
import { resolveDiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const en = {
  subscriptionClosed: () => 'notification subscription closed',
  clientClosed: () => 'DeepSeek Harness runtime client is closed',
  notRunning: () => 'DeepSeek Harness runtime is not running',
  failedStart: () => 'DeepSeek Harness runtime failed to start',
  exited: () => 'DeepSeek Harness runtime exited',
  closed: () => 'DeepSeek Harness runtime closed',
  identity: (value: string) => `initialize returned no server identity: ${value}`,
  messageId: (value: string) => `session/prompt returned no message id: ${value}`,
  workingDirectory: (method: string, value: string) => `${method} returned no working directory: ${value}`,
  stderr: (value: string) => `stderr tail:\n${value}`,
  spawn: (value: string) => `spawn error: ${value}`,
  exitCode: (value: string) => `exit code: ${value}`,
  shutdown: (value: string) => `shutdown request failed: ${value}`,
  timeout: (method: string, ms: number, description: string, stderr: string) => `${method} timed out after ${ms}ms waiting for ${description}${stderr}`,
  initializationCleanup: () => 'DeepSeek Harness initialization and cleanup failed',
  version: (client: string, dsh: string) => `dsh SDK client ${client} requires the same dsh version, got ${dsh}`,
  noExecutable: () => '@deepseek-ai/dsh declares no dsh executable',
  missingExecutable: (bin: string, source: string, patch: string, config: string) => `@deepseek-ai/dsh is missing its built executable ${bin} and complete source launch files ${source}, ${patch}, ${config}`,
  profile: (profile: string) => `dsh profile ${profile}`,
  killTimeout: (ms: number, accepted: boolean) => `runtime process did not exit within ${ms}ms after SIGKILL was ${accepted ? 'accepted' : 'refused'}`,
  killFailed: () => 'SIGKILL failed',
  reasonEnvelope: (value: string) => `turn/end carried no reason envelope: ${value}`,
  abortedReason: (value: string) => `turn/end carried a malformed aborted reason: ${value}`,
  hookReason: (value: string) => `turn/end carried a malformed hook abort reason: ${value}`,
  unknownReason: (value: string) => `turn/end carried an unknown abort reason: ${value}`,
  eventEnvelope: (value: string) => `session.event carried no event envelope: ${value}`,
  messageContent: (value: string) => `assistant/message event carried malformed content: ${value}`,
  turnData: (value: string) => `turn/end event carried malformed data: ${value}`,
}

const ja = {
  subscriptionClosed: () => '通知の購読を閉じました',
  clientClosed: () => 'DeepSeek Harness ランタイムクライアントは閉じています',
  notRunning: () => 'DeepSeek Harness ランタイムは実行されていません',
  failedStart: () => 'DeepSeek Harness ランタイムを起動できませんでした',
  exited: () => 'DeepSeek Harness ランタイムが終了しました',
  closed: () => 'DeepSeek Harness ランタイムを閉じました',
  identity: (value: string) => `initialize がサーバー識別情報を返しませんでした: ${value}`,
  messageId: (value: string) => `session/prompt がメッセージ ID を返しませんでした: ${value}`,
  workingDirectory: (method: string, value: string) => `${method} が作業ディレクトリを返しませんでした: ${value}`,
  stderr: (value: string) => `標準エラー末尾:\n${value}`,
  spawn: (value: string) => `起動エラー: ${value}`,
  exitCode: (value: string) => `終了コード: ${value}`,
  shutdown: (value: string) => `shutdown リクエストが失敗しました: ${value}`,
  timeout: (method: string, ms: number, description: string, stderr: string) => `${description} の ${method} は ${ms}ms 待機後にタイムアウトしました${stderr}`,
  initializationCleanup: () => 'DeepSeek Harness の初期化と後処理が失敗しました',
  version: (client: string, dsh: string) => `dsh SDK クライアント ${client} には同じ dsh バージョンが必要です。実際: ${dsh}`,
  noExecutable: () => '@deepseek-ai/dsh に dsh 実行ファイルの宣言がありません',
  missingExecutable: (bin: string, source: string, patch: string, config: string) => `@deepseek-ai/dsh のビルド済み実行ファイル ${bin} と起動に必要なソースファイル一式 ${source}, ${patch}, ${config} がありません`,
  profile: (profile: string) => `dsh プロファイル ${profile}`,
  killTimeout: (ms: number, accepted: boolean) => `SIGKILL が${accepted ? '受理' : '拒否'}されてから ${ms}ms 以内にランタイムプロセスが終了しませんでした`,
  killFailed: () => 'SIGKILL が失敗しました',
  reasonEnvelope: (value: string) => `turn/end に終了理由のエンベロープがありません: ${value}`,
  abortedReason: (value: string) => `turn/end の中止理由が不正です: ${value}`,
  hookReason: (value: string) => `turn/end のフック中止理由が不正です: ${value}`,
  unknownReason: (value: string) => `turn/end の中止理由が不明です: ${value}`,
  eventEnvelope: (value: string) => `session.event にイベントエンベロープがありません: ${value}`,
  messageContent: (value: string) => `assistant/message イベントの内容が不正です: ${value}`,
  turnData: (value: string) => `turn/end イベントのデータが不正です: ${value}`,
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
