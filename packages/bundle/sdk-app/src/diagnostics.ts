/** Source-owned English and Japanese human diagnostics. Parameters retain original diagnostic data. */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  exampleDshProfileServeOneSDKRuntimeUntilIts: (value0: string) => `
Example:
  dsh --profile ${value0}     serve one SDK runtime until its client disconnects
`,
  showThisHelp: 'show this help',
  serveDeepSeekHarnessSDKClientsOverStdioJSONRPC: 'Serve DeepSeek Harness SDK clients over stdio JSON-RPC.',
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  exampleDshProfileServeOneSDKRuntimeUntilIts: (value0: string) => `
使用例:
  dsh --profile ${value0}     クライアントの切断まで SDK 実行環境を提供
`,
  showThisHelp: 'このヘルプを表示する',
  serveDeepSeekHarnessSDKClientsOverStdioJSONRPC: '標準入出力の JSON-RPC 経由で DeepSeek Harness SDK クライアントに接続を提供します。',
}

/**
 * Select one complete diagnostic catalog for an operation.
 * @param locale - captured invocation language; direct API callers default to their process locale.
 * @returns the English or Japanese catalog with identical keys and parameter lists.
 */
export function diagnosticMessages(
  locale: DiagnosticLocale = resolveDiagnosticLocale(process.env, Intl.DateTimeFormat().resolvedOptions().locale),
): Messages {
  return locale === 'ja' ? japanese : english
}
