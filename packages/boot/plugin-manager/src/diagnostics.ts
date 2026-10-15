/** Host-side diagnostic language selection; browser consumers use the pure catalog. */
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import { diagnosticCatalog } from './messages.ts'

/**
 * Select one complete diagnostic catalog for an operation.
 * @param locale - captured invocation language; direct Host API callers default to their process locale.
 * @returns the English, Chinese, or Japanese catalog with identical keys and parameter lists.
 */
export function diagnosticMessages(
  locale: DiagnosticLocale = resolveDiagnosticLocale(process.env, Intl.DateTimeFormat().resolvedOptions().locale),
): ReturnType<typeof diagnosticCatalog> {
  return diagnosticCatalog(locale)
}
