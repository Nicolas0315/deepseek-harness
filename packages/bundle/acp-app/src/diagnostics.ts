/** Source-owned English and Japanese human diagnostics. Parameters retain original diagnostic data. */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  exampleDshProfileAcpServeACPUntilTheClient: '\nExample:\n  dsh --profile acp     serve ACP until the client disconnects\n',
  showThisHelp: 'show this help',
  serveAutomationClientsOverAgentClientProtocolStdio: 'Serve automation clients over Agent Client Protocol stdio.',
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  exampleDshProfileAcpServeACPUntilTheClient: '\n使用例:\n  dsh --profile acp     クライアントの切断まで ACP を提供\n',
  showThisHelp: 'このヘルプを表示する',
  serveAutomationClientsOverAgentClientProtocolStdio: '標準入出力の Agent Client Protocol 経由で自動化クライアントに接続を提供します。',
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
