/** Read plugin display text and icons through exported resources without evaluating plugin code. */

import { defaultDiagnosticLocale, diagnosticMessages } from './diagnostics.ts'
import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, relative, resolve, sep, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ModuleLoader } from '@deepseek-ai/cordis-plugin-loader'
import type { LocalizedText, PluginLocalizedMeta } from '@deepseek-ai/dsh-package-manifest'
import { barePackageName } from './profile-resolution/resolver.ts'
import { realModuleFile } from './profile-resolution/legacy-links.ts'

const LANGUAGE_ID = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u

type DisplayFields = Record<'title' | 'description', string | undefined>

/** Maximum raw icon bytes admitted to plugin metadata. */
const MAX_ICON_BYTES = 256 * 1024
const ICON_MEDIA_TYPES = new Map([
  ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'],
])

function iconOf(
  specifier: string, packageName: string, parentURL: string, manifestPath: string | undefined, value: unknown, locale: DiagnosticLocale,
): string | undefined {
  const messages = diagnosticMessages(locale)
  const icon = manifestPath === undefined ? undefined : textOf(value, `${manifestPath}: icon`, locale)
  let target: string
  // Diagnostics name the file the author edits: the declaring manifest or the exported image.
  let label: string
  if (manifestPath !== undefined && icon !== undefined) {
    if (isAbsolute(icon) || win32.isAbsolute(icon) || /^[A-Za-z][A-Za-z\d+.-]*:/u.test(icon)) {
      throw new Error(messages.iconMustBeARelativeFilePath(manifestPath))
    }
    label = manifestPath
    const root = realpathSync(dirname(manifestPath))
    target = resolve(root, icon)
    const local = relative(root, realModuleFile(target))
    if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) {
      throw new Error(messages.iconMustRemainInsideItsManifestDirectory(label))
    }
  } else {
    const exported = optionalResourcePath(`${specifier}/icon`, parentURL, locale)
    if (exported === undefined) return undefined
    target = label = exported
    assertPackageOwned(realModuleFile(target), packageName, locale)
  }
  const mediaType = ICON_MEDIA_TYPES.get(extname(target).toLowerCase())
  if (mediaType === undefined) throw new Error(messages.iconMustBeSVGPNGJPEGOrWebP(label))
  const file = realModuleFile(target)
  const stat = statSync(file)
  if (!stat.isFile()) throw new Error(messages.iconMustBeARegularFile(label))
  if (stat.size > MAX_ICON_BYTES) throw new Error(messages.iconExceedsKiB(label))
  const bytes = readFileSync(file)
  if (bytes.length > MAX_ICON_BYTES) throw new Error(messages.iconExceedsKiB(label))
  return `data:${mediaType};base64,${bytes.toString('base64')}`
}

/** Require an ancestor of the real file whose package.json names the owning package. */
function assertPackageOwned(file: string, name: string, locale: DiagnosticLocale): void {
  const messages = diagnosticMessages(locale)
  for (let directory = dirname(file); ; directory = dirname(directory)) {
    const manifest = join(directory, 'package.json')
    if (existsSync(manifest) && readObject(manifest, locale).name === name) return
    if (dirname(directory) === directory) throw new Error(messages.iconMustRemainInsideItsPackageDirectory(file))
  }
}

/**
 * Resolve a plugin resource through the active Node ESM resolver without evaluating it.
 * @param specifier - plugin module or exported resource specifier.
 * @param parentURL - owning module-resolution base.
 * @param locale - captured diagnostic language; omitted, selects the process preference once.
 * @returns the local filesystem path selected by Node and the active profile.
 * @throws when the resolver is unavailable or the resource cannot resolve to a local file.
 */
export function resolvePluginResource(
  specifier: string, parentURL: string, locale: DiagnosticLocale = defaultDiagnosticLocale(),
): string {
  const messages = diagnosticMessages(locale)
  const loader = ModuleLoader.fromInternal()
  if (loader === undefined) throw new Error(messages.pluginMetadataRequiresTheNodeModuleResolver)
  const result = loader.version === 'v2'
    ? loader.resolveSync(parentURL, { specifier, attributes: {} })
    : loader.resolveSync(specifier, parentURL, {})
  return fileURLToPath(result.url)
}

function missingResource(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code
  return code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || code === 'ERR_MODULE_NOT_FOUND'
    || code === 'MODULE_NOT_FOUND' || code === 'ENOENT' || code === 'ENOTDIR'
}

function optionalResourcePath(specifier: string, parentURL: string, locale: DiagnosticLocale): string | undefined {
  try {
    return resolvePluginResource(specifier, parentURL, locale)
  } catch (error) {
    if (missingResource(error)) return undefined
    throw error
  }
}

function objectOf(value: unknown, path: string, locale: DiagnosticLocale): Record<string, unknown> {
  const messages = diagnosticMessages(locale)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(messages.mustBeAnObject(path))
  }
  return value as Record<string, unknown>
}

function textOf(value: unknown, path: string, locale: DiagnosticLocale): string | undefined {
  const messages = diagnosticMessages(locale)
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim() === '') throw new Error(messages.mustBeANonEmptyString(path))
  return value
}

function readObject(file: string, locale: DiagnosticLocale): Record<string, unknown> {
  let contents: unknown
  try {
    contents = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`${file}: ${String(error)}`)
  }
  return objectOf(contents, file, locale)
}

function fallbackText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function dictionariesOf(englishPath: string, specifier: string, parentURL: string, locale: DiagnosticLocale): Map<string, DisplayFields> {
  const messages = diagnosticMessages(locale)
  const dictionaries = new Map<string, DisplayFields>()
  for (const entry of readdirSync(dirname(englishPath), { withFileTypes: true })) {
    if (!entry.name.endsWith('.json')) continue
    const resource = `${specifier}/locale/${entry.name}`
    const language = entry.name.slice(0, -5)
    if (!LANGUAGE_ID.test(language)) throw new Error(messages.mustUseALanguageIdAsItsFilename(resource))
    const id = language.toLowerCase()
    if (dictionaries.has(id)) throw new Error(messages.duplicatesLocale(resource, id))
    const file = resolvePluginResource(resource, parentURL, locale)
    if (dirname(file) !== dirname(englishPath)) {
      throw new Error(messages.mustShareTheEnglishLocaleDirectory(resource, file, dirname(englishPath)))
    }
    const parsed = readObject(file, locale)
    const meta = parsed.meta === undefined ? undefined : objectOf(parsed.meta, `${file}: meta`, locale)
    dictionaries.set(id, {
      title: textOf(meta?.title, `${file}: meta.title`, locale),
      description: textOf(meta?.description, `${file}: meta.description`, locale),
    })
  }
  return dictionaries
}

function localizedText(
  field: keyof DisplayFields, dictionaries: Map<string, DisplayFields>, fallback: string | undefined, finalFallback: string,
): LocalizedText | undefined {
  const entries = [...dictionaries].flatMap(([language, fields]): [string, string][] => {
    const value = fields[field]
    return value === undefined ? [] : [[language, value]]
  })
  if (entries.length === 0) return fallback
  return { en: fallback ?? finalFallback, ...Object.fromEntries(entries) }
}

/**
 * Read plugin locale JSON display text and icon without evaluating JavaScript entries.
 * Only a package-root specifier reads its exported package.json: `name`/`description` fill missing
 * locale fields, and a declared `icon` takes priority over the `<specifier>/icon` resource.
 * A subpath specifier never reads package.json; its icon comes only from `<specifier>/icon`.
 * Manifest icons remain inside their declaring directory; exported icons remain inside their
 * owning package after realpath resolution. Both accept SVG, PNG, JPEG, or WebP up to 256 KiB.
 * Icon failures retain display text without falling back.
 * Non-package specifiers are skipped without invoking the resource resolver.
 * Language files share the directory containing the resolved English resource;
 * each file is resolved through the complete plugin specifier before reading.
 * Translation maps retain an English fallback, ultimately the full module specifier
 * for titles and empty for descriptions.
 * @param specifier - configured plugin module name, including any package subpath.
 * @param parentURL - owning Loader tree's module-resolution base.
 * @param locale - captured diagnostic language; omitted, selects the process preference once.
 * @returns display fields and any resource diagnostic, or undefined for non-package specifiers or absent metadata.
 */
export function readPluginMeta(
  specifier: string, parentURL: string, locale: DiagnosticLocale = defaultDiagnosticLocale(),
): PluginLocalizedMeta | undefined {
  const messages = diagnosticMessages(locale)
  const packageName = barePackageName(specifier)
  if (packageName === undefined) return undefined
  try {
    const englishPath = optionalResourcePath(`${specifier}/locale/en.json`, parentURL, locale)
    const dictionaries = englishPath === undefined
      ? new Map<string, DisplayFields>() : dictionariesOf(englishPath, specifier, parentURL, locale)
    const manifestPath = packageName === specifier ? optionalResourcePath(`${specifier}/package.json`, parentURL, locale) : undefined
    const manifest = manifestPath === undefined ? undefined : readObject(manifestPath, locale)
    const title = localizedText('title', dictionaries, fallbackText(manifest?.name), specifier)
    const description = localizedText('description', dictionaries, fallbackText(manifest?.description), '')
    const text = {
      ...title === undefined ? {} : { title },
      ...description === undefined ? {} : { description },
    }
    let icon: string | undefined
    try {
      icon = iconOf(specifier, packageName, parentURL, manifestPath, manifest?.icon, locale)
    } catch (error) {
      return { ...text, error: messages.metadataFailure(specifier, String(error)) }
    }
    if (title === undefined && description === undefined && icon === undefined) return undefined
    return { ...text, ...icon === undefined ? {} : { icon } }
  } catch (error) {
    return { error: messages.metadataFailure(specifier, String(error)) }
  }
}
