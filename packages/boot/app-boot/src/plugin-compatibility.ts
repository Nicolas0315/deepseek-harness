/** Evaluate plugin dsh peer requirements without importing plugin code. */

import { diagnosticMessages, defaultDiagnosticLocale } from './diagnostics.ts'
import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

/** Incompatible dsh peers and the exact plugin/runtime exemption decision. */
export interface PluginCompatibility {
  name: string
  version: string
  runtimeVersion: string
  /** Only peer requirements not satisfied by the running dsh version. */
  peers: Record<string, string>
  exempted: boolean
}

function objectOf(value: unknown, field: string, locale: DiagnosticLocale): Record<string, unknown> {
  const messages = diagnosticMessages(locale)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(messages.mustBeAnObject(field))
  }
  return value as Record<string, unknown>
}

function runtimeVersionOf(value: unknown, locale: DiagnosticLocale): string {
  const messages = diagnosticMessages(locale)
  if (typeof value !== 'string' || semver.valid(value) === null) {
    throw new Error(messages.invalidDshRuntimeVersionExpectedASemanticVersion(JSON.stringify(value)))
  }
  return value
}

function identityField(manifest: Record<string, unknown>, field: 'name' | 'version', locale: DiagnosticLocale): string {
  const messages = diagnosticMessages(locale)
  const value = Object.hasOwn(manifest, field) ? manifest[field] : undefined
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(messages.pluginManifestMustBeANonEmptyStringWhen(field))
  }
  return value
}

/**
 * Read this app-boot package's version in both source and bundled installations.
 * @param locale - diagnostic language captured for this operation.
 * @returns the validated runtime semantic version, preserving its exact spelling.
 * @throws if package.json cannot be read or its version is missing or invalid.
 */
export function getDshRuntimeVersion(locale: DiagnosticLocale = defaultDiagnosticLocale()): string {
  // The executable's virtual filesystem intercepts string paths, not URL arguments.
  const filename = fileURLToPath(new URL('../package.json', import.meta.url))
  const manifest = objectOf(JSON.parse(fs.readFileSync(filename, 'utf8')), 'app-boot package.json', locale)
  return runtimeVersionOf(Object.hasOwn(manifest, 'version') ? manifest.version : undefined, locale)
}

/**
 * Check every @deepseek-ai/dsh or @deepseek-ai/dsh-* peer against the runtime.
 * Prereleases participate in ranges. workspace:^, workspace:~, and workspace:*
 * refer to the current runtime; other invalid ranges are incompatible.
 * @param manifest - parsed plugin package.json; inherited fields are ignored.
 * @param exemptions - exact plugin name@version keys mapped to exact runtime versions.
 * @param runtimeVersion - running dsh version, defaulting to this app-boot package.
 * @param locale - diagnostic language captured for this operation.
 * @returns incompatible peers and exemption status, or undefined when none are incompatible.
 * @throws for malformed manifest peer fields, invalid runtime versions, or missing identity on a mismatch.
 */
export function evaluatePluginCompatibility(
  manifest: object,
  exemptions: Readonly<Record<string, readonly string[]>> = {},
  runtimeVersion?: string,
  locale: DiagnosticLocale = defaultDiagnosticLocale(),
): PluginCompatibility | undefined {
  const messages = diagnosticMessages(locale)
  runtimeVersion ??= getDshRuntimeVersion(locale)
  runtimeVersionOf(runtimeVersion, locale)
  const fields = objectOf(manifest, messages.pluginManifest, locale)
  if (!Object.hasOwn(fields, 'peerDependencies')) return undefined
  const dependencies = objectOf(fields.peerDependencies, messages.pluginManifestPeers, locale)
  const peers: Record<string, string> = {}
  for (const [name, range] of Object.entries(dependencies)) {
    if (typeof range !== 'string') {
      throw new Error(messages.pluginManifestPeerDependenciesMustBeAString(JSON.stringify(name)))
    }
    if (name !== '@deepseek-ai/dsh' && !name.startsWith('@deepseek-ai/dsh-')) continue
    const requirement = ['workspace:^', 'workspace:~', 'workspace:*'].includes(range) ? runtimeVersion : range
    if (requirement.trim() === '' || !semver.satisfies(runtimeVersion, requirement, { includePrerelease: true })) {
      peers[name] = range
    }
  }
  if (Object.keys(peers).length === 0) return undefined
  const name = identityField(fields, 'name', locale)
  const version = identityField(fields, 'version', locale)
  const key = `${name}@${version}`
  const exemptedVersions = Object.hasOwn(exemptions, key) ? exemptions[key] : undefined
  const exempted = exemptedVersions?.includes(runtimeVersion) === true
  return { name, version, runtimeVersion, peers, exempted }
}

/**
 * Describe incompatible peers, their risk, and the exact-version remedy.
 * Surfaces with their own grant mechanism or locale render the structured result themselves.
 * @param issue - incompatible plugin/runtime result, including exempted mismatches.
 * @param locale - diagnostic language captured for this operation.
 * @returns a diagnostic in the operation's selected language for logs and stderr.
 */
export function pluginCompatibilityWarning(issue: PluginCompatibility, locale: DiagnosticLocale = defaultDiagnosticLocale()): string {
  const messages = diagnosticMessages(locale)
  const key = `${issue.name}@${issue.version}`
  return messages.pluginIncompatible(
    key, issue.runtimeVersion, JSON.stringify(issue.peers), key, issue.runtimeVersion,
    issue.exempted ? messages.activeExemption : messages.inactiveExemption,
  )
}
