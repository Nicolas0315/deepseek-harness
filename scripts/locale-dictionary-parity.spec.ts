/**
 * Gate for the invariant `FALLBACK_LOCALE` rests on: every shipped dictionary
 * declares the same keys in `zh`, `en`, and `ja`.
 *
 * The locale runtime resolves a key through the active locale, then through
 * the single fallback locale (`en`), then surfaces the key itself. With
 * symmetric dictionaries that middle step always resolves, so one constant can
 * serve as both the opening locale and the dictionary fallback. A key added to
 * only one side breaks that: a reader of the other language sees a bare key
 * such as `list.aria` instead of text. This gate fails on the asymmetry rather
 * than waiting for the bare key to reach a UI.
 *
 * Discovery is deliberately broad, because a gate that silently narrows is
 * worse than no gate. It sweeps every workspace package (not just
 * `packages/client`), reads dictionaries wherever they are declared —
 * `locales.ts`, a `locales/` directory, or inline in the plugin body — and
 * pairs `zh`/`en` across sibling files as well as within one module. A `zh`
 * dictionary whose `en` counterpart cannot be found anywhere is an error, not
 * a skip.
 */

import type { Dirent } from 'node:fs'
import { globSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

/** Repo-relative path with `/` separators, so messages and suffix tests match on every OS. */
function relative(file: string): string {
  return file.slice(root.length).replaceAll('\\', '/')
}

/** Every `.ts` source file under each workspace package's `src`, excluding declarations. */
function sourceFiles(): string[] {
  const files: string[] = []
  const packagesRoot = resolve(root, 'packages')
  for (const group of directories(packagesRoot)) {
    for (const pkg of directories(resolve(packagesRoot, group))) {
      walk(resolve(packagesRoot, group, pkg, 'src'), files)
    }
  }
  files.push(resolve(root, 'apps/desktop/src/locale.ts'))
  return files.sort()
}

/** Immediate subdirectory names, or none when the path is not a directory. */
function directories(dir: string): string[] {
  return readEntries(dir).filter(entry => entry.isDirectory()).map(entry => entry.name)
}

/**
 * Directory entries, treating only a genuinely absent directory as empty.
 * Any other failure (`EACCES`, I/O) rethrows: silently reading it as "absent"
 * would narrow the sweep and let the gate pass while checking less.
 * @param dir - absolute directory path.
 * @returns entries, or none when the directory does not exist.
 */
function readEntries(dir: string): Dirent[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

function walk(dir: string, out: string[]): void {
  for (const entry of readEntries(dir)) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if ((/\.tsx?$/.test(entry.name)) && !entry.name.endsWith('.d.ts')) out.push(full)
  }
}

/** One discovered dictionary: which file and export name declared it. */
interface Dictionary {
  /** Repo-relative declaring file. */
  file: string
  /** Export name, or the registration site for an inline literal. */
  name: string
  /** Declared keys, sorted. */
  keys: string[]
  /** Named interpolation parameters declared by each local entry. */
  parameters: Record<string, string[]>
}

/**
 * Keys of every top-level `export const <name> = { ... }` object literal whose
 * name identifies a locale dictionary, plus inline `register(ns, locale, {...})`
 * literals. Read from the AST so the gate never executes package code.
 * @param file - absolute path of a candidate module.
 * @returns discovered dictionaries, keyed by locale-bearing name.
 */
function dictionariesIn(file: string): Dictionary[] {
  const text = readFileSync(file, 'utf8')
  // Cheap pre-filter: parsing every package source is wasteful. The pattern
  // must admit every shape `localeOf` accepts, or a file would be skipped
  // before parsing — the silent narrowing this gate exists to prevent. A bare
  // `\b(zh|en|ja)\b` misses `zhSettings`/`accessZh`, because `\b` does not hold
  // between `h` and an uppercase letter.
  if (!/\b(zh|en|ja)\b|\b(zh|en|ja)[A-Z]|(Zh|En|Ja)\b/.test(text)) return []
  const source = sourceOf(file)
  const found: Dictionary[] = []
  const rel = relative(file)

  // Module-scope variable declarations, keyed by name. A 3-arg
  // `register(NS, 'zh'|'en', dict)` whose third argument is an identifier —
  // e.g. a local dictionary variable rather than an inline literal — resolves
  // through here so the gate still verifies its symmetry.
  const moduleConsts = new Map<string, ts.Expression>()
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer !== undefined) {
        moduleConsts.set(decl.name.text, decl.initializer)
      }
    }
  }

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    if (statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) !== true) continue
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue
      const literal = unwrap(decl.initializer)
      if (literal === undefined || !ts.isObjectLiteralExpression(literal)) continue
      if (localeOf(decl.name.text) === undefined) continue
      found.push({ file: rel, name: decl.name.text, keys: keysOf(literal), parameters: parametersOf(literal) })
    }
  }

  // A 3-arg `register(ns, 'zh'|'en', dict)` call whose dictionary argument we
  // cannot turn into an object literal. We refuse instead of skipping: a
  // registration we cannot measure is exactly the silent narrowing this gate
  // exists to catch.
  const refuse = (ns: string, tag: string, why: string): never => {
    throw new Error(`cannot verify register('${ns}', '${tag}', ...) in ${rel}: ${why}`)
  }

  // Inline registrations, two shapes. A `[['zh', {...}], ['en', {...}]]` pair
  // handed to a registration loop keys off the enclosing array; separate
  // `register(NS, 'zh', {...})` / `register(NS, 'en', {...})` calls key off the
  // namespace argument, so the two calls pair with each other.
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      const name = ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : ts.isIdentifier(callee) && callee.text === 'register' ? 'register' : undefined
      if (name === 'register' && node.arguments.length >= 3) {
        const [ns, tag, dict] = node.arguments
        if (ns === undefined || tag === undefined || !ts.isStringLiteral(tag)) return
        if (tag.text !== 'zh' && tag.text !== 'en' && tag.text !== 'ja') return
        const raw = unwrap(dict)
        const literal = raw !== undefined && ts.isIdentifier(raw)
          ? (() => {
            const resolved = moduleConsts.get(raw.text)
            return resolved === undefined ? undefined : unwrap(resolved)
          })()
          : raw
        const why = raw !== undefined && ts.isIdentifier(raw)
          ? `third argument ${raw.text} does not resolve to an inline or module-scope object literal`
          : 'third argument is neither an object literal nor a resolvable dictionary variable'
        if (literal === undefined || !ts.isObjectLiteralExpression(literal)) {
          // The dictionary argument must resolve to an object literal; the
          // gate refuses rather than skips, so the symmetry it verifies never
          // silently narrows.
          refuse(ns.getText(source), tag.text, why)
        }
        const dictionary: ts.ObjectLiteralExpression = literal as ts.ObjectLiteralExpression
        // The namespace expression's source text identifies the pair, so the
        // zh and en calls for one namespace meet and calls for different
        // namespaces stay apart.
        found.push({ file: rel, name: `${tag.text}@register:${ns.getText(source)}`, keys: keysOf(dictionary), parameters: parametersOf(dictionary) })
      }
    }
    if (ts.isArrayLiteralExpression(node) && node.elements.length >= 2) {
      const site = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
      for (const element of node.elements) {
        if (!ts.isArrayLiteralExpression(element) || element.elements.length !== 2) continue
        const [tag, dict] = element.elements
        const literal = unwrap(dict)
        if (tag === undefined || !ts.isStringLiteral(tag)) continue
        if (literal === undefined || !ts.isObjectLiteralExpression(literal)) continue
        if (tag.text !== 'zh' && tag.text !== 'en' && tag.text !== 'ja') continue
        found.push({ file: rel, name: `${tag.text}@inline:${site}`, keys: keysOf(literal), parameters: parametersOf(literal) })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

const sources = new Map<string, ts.SourceFile>()

/** Parse source without evaluating dictionary modules or their dependencies. */
function sourceOf(file: string): ts.SourceFile {
  let source = sources.get(file)
  if (source === undefined) {
    source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true)
    sources.set(file, source)
  }
  return source
}

/** Resolve a dictionary spread through local declarations and relative named imports. */
function namedDictionary(source: ts.SourceFile, name: string): ts.ObjectLiteralExpression {
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name) continue
        const value = unwrap(declaration.initializer)
        if (value !== undefined && ts.isObjectLiteralExpression(value)) return value
      }
    }
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const bindings = statement.importClause?.namedBindings
    if (bindings === undefined || !ts.isNamedImports(bindings)) continue
    const binding = bindings.elements.find(element => element.name.text === name)
    if (binding === undefined || !statement.moduleSpecifier.text.startsWith('.')) continue
    return namedDictionary(sourceOf(resolve(dirname(source.fileName), statement.moduleSpecifier.text)),
      binding.propertyName?.text ?? binding.name.text)
  }
  throw new Error(`cannot resolve dictionary spread ${name} in ${relative(source.fileName)}`)
}

/** Flatten owned dictionary spreads with JavaScript's last-entry-wins ordering. */
function dictionaryProperties(
  literal: ts.ObjectLiteralExpression, visiting = new Set<ts.ObjectLiteralExpression>(),
): Map<string, ts.Expression> {
  if (visiting.has(literal)) throw new Error(`cyclic dictionary spread in ${relative(literal.getSourceFile().fileName)}`)
  visiting.add(literal)
  const entries = new Map<string, ts.Expression>()
  for (const prop of literal.properties) {
    if (ts.isSpreadAssignment(prop)) {
      const value = unwrap(prop.expression)
      const target = value !== undefined && ts.isIdentifier(value)
        ? namedDictionary(literal.getSourceFile(), value.text) : value
      if (target === undefined || !ts.isObjectLiteralExpression(target)) {
        throw new Error(`unsupported dictionary spread in ${relative(literal.getSourceFile().fileName)}`)
      }
      for (const [key, entry] of dictionaryProperties(target, visiting)) entries.set(key, entry)
    } else if (ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
      entries.set(prop.name.text, prop.initializer)
    }
  }
  visiting.delete(literal)
  return entries
}

/** Declared and inherited dictionary keys, sorted. */
function keysOf(literal: ts.ObjectLiteralExpression): string[] {
  return [...dictionaryProperties(literal).keys()].sort()
}

/** Named placeholders in each resolved dictionary value. */
function parametersOf(literal: ts.ObjectLiteralExpression): Record<string, string[]> {
  return Object.fromEntries([...dictionaryProperties(literal)].map(([key, value]) => [
    key, [...new Set([...value.getText().matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/gu)].map(match => match[1]!))].sort(),
  ]))
}

/** Report incomplete translations and changed named interpolation parameters. */
function dictionaryProblems(reference: Dictionary, translated: Dictionary, checkParameters: boolean): string[] {
  const problems: string[] = []
  const missing = reference.keys.filter(k => !translated.keys.includes(k))
  const extra = translated.keys.filter(k => !reference.keys.includes(k))
  if (missing.length > 0) problems.push(`${translated.file} ${translated.name} missing: ${missing.join(', ')}`)
  if (extra.length > 0) problems.push(`${translated.file} ${translated.name} extra: ${extra.join(', ')}`)
  if (checkParameters) {
    for (const entry of reference.keys.filter(k => translated.keys.includes(k))) {
      if (JSON.stringify(reference.parameters[entry]) !== JSON.stringify(translated.parameters[entry])) {
        problems.push(`${translated.file} ${translated.name}.${entry} has different interpolation parameters`)
      }
    }
  }
  return problems
}

/** Look through `satisfies`/`as`/parenthesized wrappers to the literal. */
function unwrap(node: ts.Expression | undefined): ts.Expression | undefined {
  let current = node
  while (
    current !== undefined
    && (ts.isSatisfiesExpression(current) || ts.isAsExpression(current) || ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }
  return current
}

/**
 * The locale a dictionary name declares, and the namespace-ish remainder that
 * identifies which pair it belongs to. `zh`/`en`, `zhSettings`/`enSettings`,
 * and `settingsZh`/`settingsEn` are the shapes this repo uses. A name-prefix
 * shape requires an uppercase ASCII letter at the third position (`[A-Z]`),
 * matching the admission of the cheap pre-filter, so `zh2Foo`/`zh_probe`
 * cannot be treated as dictionaries in one place and skipped in another.
 * @param name - export name or synthetic inline name.
 * @returns locale plus pair key, or undefined when the name names no locale.
 */
function localeOf(name: string): { locale: 'zh' | 'en' | 'ja'; pair: string } | undefined {
  for (const locale of ['zh', 'en', 'ja'] as const) {
    const other = locale === 'zh' ? 'Zh' : locale === 'ja' ? 'Ja' : 'En'
    if (name === locale) return { locale, pair: '' }
    // Synthetic names for inline shapes carry their own pair key after the
    // first ':' (the enclosing array's line, or the namespace expression).
    if (name.startsWith(`${locale}@`)) return { locale, pair: name.slice(name.indexOf(':')) }
    if (name.startsWith(locale) && name.length > 2 && /[A-Z]/.test(name[2] ?? '')) {
      return { locale, pair: name.slice(2) }
    }
    if (name.endsWith(other)) return { locale, pair: name.slice(0, -2) }
  }
  return undefined
}

describe('shipped locale dictionaries', () => {
  it('rejects missing inherited keys, unexpected keys, and changed inherited parameters', () => {
    const source = ts.createSourceFile('dictionary-fixture.ts', `
      const commonEn = { greeting: 'Hello {name}', inherited: 'Inherited' }
      const commonJa = { greeting: 'こんにちは {wrong}' }
      export const en = { ...commonEn, title: 'Title' }
      export const ja = { ...commonJa, title: 'タイトル', extra: '余分' }
    `, ts.ScriptTarget.ESNext, true)
    const dictionary = (name: string): Dictionary => {
      const literal = namedDictionary(source, name)
      return { file: 'dictionary-fixture.ts', name, keys: keysOf(literal), parameters: parametersOf(literal) }
    }
    expect(dictionaryProblems(dictionary('en'), dictionary('ja'), true)).toEqual([
      'dictionary-fixture.ts ja missing: inherited',
      'dictionary-fixture.ts ja extra: extra',
      'dictionary-fixture.ts ja.greeting has different interpolation parameters',
    ])
  })

  it('ships Japanese display metadata for every package with English locale metadata', () => {
    const files = [...globSync('packages/*/*/locale/en.json', { cwd: root })]
    expect(files.length).toBeGreaterThanOrEqual(30)
    for (const file of files) {
      const en = JSON.parse(readFileSync(resolve(root, file), 'utf8')) as { meta: Record<string, string> }
      const ja = JSON.parse(readFileSync(resolve(root, file.replace(/en\.json$/, 'ja.json')), 'utf8')) as { meta: Record<string, string> }
      expect(Object.keys(ja.meta).sort(), file).toEqual(Object.keys(en.meta).sort())
      for (const text of Object.values(ja.meta)) expect(text.trim(), file).not.toBe('')
    }
  })

  it('declares the same keys and Japanese placeholders in all shipped locales, so the single fallback locale always resolves', () => {
    const files = sourceFiles()
    // Guard the discovery itself: an empty or narrowed sweep would pass every
    // assertion below while checking nothing.
    expect(files.length).toBeGreaterThan(500)

    // Pair within a file first; a dictionary whose counterpart is not in the
    // same module then pairs with a sibling in the same directory. Both shapes
    // ship here: `locales/settings.ts` exports zh+en together, while
    // `locales/zh.ts` + `locales/en.ts` split the common pair across files.
    const perFile = new Map<string, Dictionary[]>()
    for (const file of files) {
      const dicts = dictionariesIn(file)
      if (dicts.length > 0) perFile.set(relative(file), dicts)
    }

    const groups = new Map<string, Map<'zh' | 'en' | 'ja', Dictionary>>()
    const place = (key: string, locale: 'zh' | 'en' | 'ja', dict: Dictionary): void => {
      const slot = groups.get(key) ?? new Map<'zh' | 'en' | 'ja', Dictionary>()
      if (slot.has(locale)) {
        throw new Error(`two ${locale} dictionaries claim pair ${key}: ${slot.get(locale)?.file} and ${dict.file}`)
      }
      slot.set(locale, dict)
      groups.set(key, slot)
    }

    for (const [rel, dicts] of perFile) {
      for (const dict of dicts) {
        const parsed = localeOf(dict.name)
        if (parsed === undefined) continue
        const sameFileCounterpart = dicts.some((other) => {
          const otherParsed = localeOf(other.name)
          return otherParsed !== undefined
            && otherParsed.pair === parsed.pair
            && otherParsed.locale !== parsed.locale
        })
        // Same-file pairs key by file so two pairs in one directory stay
        // distinct; split pairs key by directory so siblings meet.
        const key = sameFileCounterpart ? `${rel}::${parsed.pair}` : `${dirname(rel)}::${parsed.pair}`
        place(key, parsed.locale, dict)
      }
    }

    const problems: string[] = []
    let comparedPairs = 0
    for (const [key, slot] of [...groups].sort()) {
      const en = slot.get('en')
      if (en === undefined) {
        problems.push(`${key} has no English dictionary`)
        continue
      }
      comparedPairs++
      for (const locale of ['zh', 'ja'] as const) {
        const translated = slot.get(locale)
        if (translated === undefined) {
          problems.push(`${key} has no ${locale} dictionary`)
          continue
        }
        problems.push(...dictionaryProblems(en, translated, locale === 'ja'))
      }
    }

    // The shipped dictionary count only grows; a collapse means discovery or
    // pairing broke, which would hide real asymmetry.
    expect(comparedPairs).toBeGreaterThan(25)
    expect(problems).toEqual([])
  })
})
