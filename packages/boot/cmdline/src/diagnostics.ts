/** Command-local language selection and public Commander presentation adapters. */

import type { Command } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import type {} from '@deepseek-ai/dsh-launch-environment'

const english = {
  missingStdioHost: 'stdio app: the launcher must provide ctx.appExit and ctx.appReady before the tree mounts',
  missingCmdlineHost: (name: string) => `${name}: the launcher must provide ctx.cmdlineArgs and ctx.appExit before the tree mounts`,
  missingAction: (name: string) => `${name}: no command in the program declares an action; parseCmdline runs the invoked command's action on a successful parse, and app code there publishes its service`,
}

const japanese: typeof english = {
  missingStdioHost: '標準入出力アプリ: 起動元はプラグインの読み込み前に ctx.appExit と ctx.appReady を提供する必要があります',
  missingCmdlineHost: (name: string) => `${name}: 起動元はプラグインの読み込み前に ctx.cmdlineArgs と ctx.appExit を提供する必要があります`,
  missingAction: (name: string) => `${name}: 実行処理を持つコマンドがありません。parseCmdline は解析成功時に呼び出したコマンドの処理を実行し、アプリはそこでサービスを提供する必要があります`,
}

/**
 * Select complete app-command diagnostics for the captured language.
 * @param locale - language captured for this app invocation.
 * @returns the catalog of launcher integration diagnostics.
 */
export function diagnosticMessages(locale: DiagnosticLocale): typeof english {
  return locale === 'ja' ? japanese : english
}

const japaneseTitles: Readonly<Record<string, string>> = {
  'Usage:': '使い方:',
  'Arguments:': '引数:',
  'Options:': 'オプション:',
  'Commands:': 'コマンド:',
}

const japaneseErrors: Readonly<Record<string, string>> = {
  'commander.unknownOption': '指定したオプションは使用できません。--help で使用可能なオプションを確認してください。',
  'commander.optionMissingArgument': 'オプションの値が不足しています。--help で必要な値を確認してください。',
  'commander.missingMandatoryOptionValue': '必須オプションがありません。--help で必要なオプションを確認してください。',
  'commander.missingArgument': '必要な引数がありません。--help で引数を確認してください。',
  'commander.excessArguments': '引数が多すぎます。--help で指定できる引数を確認してください。',
  'commander.invalidArgument': '引数の値を受け付けられません。下記の詳細と --help を確認してください。',
  'commander.unknownCommand': '指定したコマンドは使用できません。--help でコマンドを確認してください。',
  'commander.conflictingOption': '同時に指定できないオプションがあります。--help で組み合わせを確認してください。',
}

/**
 * Capture the application's effective language without changing process state.
 * @param ctx - optional app context carrying the immutable launch environment.
 * @returns the language selected by the launch environment or inherited process environment.
 */
export function resolveCommandLocale(ctx?: Context): DiagnosticLocale {
  const snapshot = ctx?.get('launchEnvironment')
  const environment = snapshot === undefined ? process.env : Object.fromEntries(
    ['DSH_LANG', 'LC_ALL', 'LC_MESSAGES', 'LANG'].map(name => [name, snapshot.get(name)?.value]),
  )
  return resolveDiagnosticLocale(environment, Intl.DateTimeFormat().resolvedOptions().locale)
}

/**
 * Render a dependency-owned parse failure using its stable Commander code.
 * Application-owned errors retain their complete already-localized message.
 * @param locale - captured invocation language.
 * @param message - original Commander or application diagnostic.
 * @param code - structured Commander failure identifier.
 * @returns localized guidance and the untouched dependency diagnostic, or the original application message.
 */
export function formatCommandError(locale: DiagnosticLocale, message: string, code?: string): string {
  const explanation = code === undefined ? undefined : japaneseErrors[code]
  return locale === 'ja' && explanation !== undefined ? `${explanation}\nCommander 原文: ${message}` : message
}

/**
 * Configure public help presentation and structured error rendering on one command tree.
 * The error delegate is captured before wrapping, preserving custom JSON stdout handling.
 * @param command - command whose options and subcommands are already declared.
 * @param locale - captured invocation language.
 */
export function configureCommandLocale(command: Command, locale: DiagnosticLocale): void {
  if (locale === 'ja') command.configureHelp({ styleTitle: title => japaneseTitles[title] ?? title })
  const error = command.error.bind(command)
  command.error = (message, options) => error(formatCommandError(locale, message, options?.code), options)
  for (const child of command.commands) configureCommandLocale(child, locale)
}
