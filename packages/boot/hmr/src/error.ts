import { Context } from '@deepseek-ai/cordis'
import { hmrMessages, resolveHmrLocale } from './diagnostics.ts'
import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import type { BuildFailure } from 'esbuild'
import { codeFrameColumns } from '@babel/code-frame'
import { readFileSync } from 'node:fs'

function isBuildFailure(e: unknown): e is BuildFailure {
  return e !== null && typeof e === 'object' && 'errors' in e && Array.isArray(e.errors)
    && e.errors.every((error: unknown) => error !== null && typeof error === 'object'
      && 'text' in error && typeof error.text === 'string')
}

/** Log HMR build failures with code frames when source locations are available.
 * @param ctx Context owning reload diagnostics.
 * @param e Failure from the module loader or compiler.
 * @param language Captured diagnostic language; omission resolves the context launch environment once.
 */
export function handleError(ctx: Context, e: unknown, language: DiagnosticLocale = resolveHmrLocale(ctx)): void {
  if (!isBuildFailure(e)) {
    ctx.logger.warn(e)
    return
  }

  for (const error of e.errors) {
    if (!error.location) {
      ctx.logger.warn(error.text)
      continue
    }
    try {
      const { file, line, column } = error.location
      const source = readFileSync(file, 'utf8')
      const formatted = codeFrameColumns(source, {
        start: { line, column },
      }, {
        highlightCode: true,
        message: error.text,
      })
      ctx.logger.warn(`${hmrMessages(language).file}: ${file}:${line}:${column}\n` + formatted)
    } catch (e) {
      ctx.logger.warn(e)
    }
  }
}
