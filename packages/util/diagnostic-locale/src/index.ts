/** Language selection shared by CLI and SDK diagnostic renderers. */

/** Languages supplied by the CLI and SDK diagnostic catalogs. */
export type DiagnosticLocale = 'en' | 'ja'

/**
 * Resolve the diagnostic language without reading or mutating process state.
 * DSH_LANG overrides LC_ALL, LC_MESSAGES and LANG; empty values are absent.
 * Unsupported languages, including C/POSIX, select English.
 * @param environment - the caller's effective launch environment.
 * @param systemLocale - the operating system locale when no variable selects one.
 * @returns Japanese for the ja primary language, otherwise English.
 */
export function resolveDiagnosticLocale(
  environment: Readonly<Record<string, string | undefined>>,
  systemLocale: string,
): DiagnosticLocale {
  const selected = ['DSH_LANG', 'LC_ALL', 'LC_MESSAGES', 'LANG']
    .map(name => environment[name])
    .find(value => value !== undefined && value.trim() !== '')
  const primary = (selected ?? systemLocale).trim().split(/[-_.@]/)[0]?.toLowerCase()
  return primary === 'ja' || primary === 'japanese' ? 'ja' : 'en'
}
