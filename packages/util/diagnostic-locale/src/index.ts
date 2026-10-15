/** Language selection shared by CLI and SDK diagnostic renderers. */

/** Languages supplied by the CLI and SDK diagnostic catalogs. */
export type DiagnosticLocale = 'en' | 'zh' | 'ja'

/**
 * Resolve the diagnostic language without reading or mutating process state.
 * DSH_LANG overrides LC_ALL, LC_MESSAGES and LANG; empty values are absent.
 * Unsupported languages, including C/POSIX, select English.
 * @param environment - the caller's effective launch environment.
 * @param systemLocale - the operating system locale when no variable selects one.
 * @returns Chinese for zh or chinese primary languages, Japanese for ja or japanese, otherwise English.
 */
export function resolveDiagnosticLocale(
  environment: Readonly<Record<string, string | undefined>>,
  systemLocale: string,
): DiagnosticLocale {
  const selected = ['DSH_LANG', 'LC_ALL', 'LC_MESSAGES', 'LANG']
    .map(name => environment[name])
    .find(value => value !== undefined && value.trim() !== '')
  const primary = (selected ?? systemLocale).trim().split(/[-_.@]/)[0]?.toLowerCase()
  if (primary === 'zh' || primary === 'chinese') return 'zh'
  return primary === 'ja' || primary === 'japanese' ? 'ja' : 'en'
}
