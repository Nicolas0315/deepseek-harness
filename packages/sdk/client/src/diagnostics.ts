/** Fixed SDK client diagnostics; interpolated runtime values remain verbatim. */
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

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

const zh = {
  subscriptionClosed: () => '通知订阅已关闭',
  clientClosed: () => 'DeepSeek Harness 运行时客户端已关闭',
  notRunning: () => 'DeepSeek Harness 运行时未运行',
  failedStart: () => 'DeepSeek Harness 运行时启动失败',
  exited: () => 'DeepSeek Harness 运行时已退出',
  closed: () => 'DeepSeek Harness 运行时已关闭',
  identity: (value: string) => `initialize 未返回服务器标识：${value}`,
  messageId: (value: string) => `session/prompt 未返回消息 ID：${value}`,
  workingDirectory: (method: string, value: string) => `${method} 未返回工作目录：${value}`,
  stderr: (value: string) => `标准错误末尾：\n${value}`,
  spawn: (value: string) => `启动错误：${value}`,
  exitCode: (value: string) => `退出代码：${value}`,
  shutdown: (value: string) => `shutdown 请求失败：${value}`,
  timeout: (method: string, ms: number, description: string, stderr: string) => `${description} 的 ${method} 等待 ${ms}ms 后超时${stderr}`,
  initializationCleanup: () => 'DeepSeek Harness 初始化和清理失败',
  version: (client: string, dsh: string) => `dsh SDK 客户端 ${client} 需要相同的 dsh 版本，实际为 ${dsh}`,
  noExecutable: () => '@deepseek-ai/dsh 未声明 dsh 可执行文件',
  missingExecutable: (bin: string, source: string, patch: string, config: string) => `@deepseek-ai/dsh 缺少已构建的可执行文件 ${bin} 和完整的源启动文件 ${source}、${patch}、${config}`,
  profile: (profile: string) => `dsh 配置文件 ${profile}`,
  killTimeout: (ms: number, accepted: boolean) => `SIGKILL ${accepted ? '已接受' : '被拒绝'}后，运行时进程未在 ${ms}ms 内退出`,
  killFailed: () => 'SIGKILL 失败',
  reasonEnvelope: (value: string) => `turn/end 未包含原因封装：${value}`,
  abortedReason: (value: string) => `turn/end 包含格式错误的中止原因：${value}`,
  hookReason: (value: string) => `turn/end 包含格式错误的钩子中止原因：${value}`,
  unknownReason: (value: string) => `turn/end 包含未知中止原因：${value}`,
  eventEnvelope: (value: string) => `session.event 未包含事件封装：${value}`,
  messageContent: (value: string) => `assistant/message 事件包含格式错误的内容：${value}`,
  turnData: (value: string) => `turn/end 事件包含格式错误的数据：${value}`,
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
