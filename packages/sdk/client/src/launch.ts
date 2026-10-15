/**
 * Resolve the public SDK launch configuration to one dsh subprocess.
 * @module @deepseek-ai/dsh-sdk-client/launch
 */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import { diagnostics, defaultDiagnosticLocale } from './diagnostics.ts'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HarnessClientOptions } from './types.ts'

/** Default bound for a profile to answer the SDK initialize handshake. */
export const DEFAULT_INITIALIZE_TIMEOUT_MS = 10_000

/** Internal generic process launch used by the transport and fake-runtime tests. */
export interface RuntimeProcessOptions {
  /** Captured diagnostic language; omitted resolves from the effective environment. */
  language?: DiagnosticLocale
  command: string
  args: string[]
  cwd?: string
  /** Materialize the complete child environment when the client starts its subprocess. */
  environment: () => NodeJS.ProcessEnv
  description: string
  initializeTimeoutMs: number
  requestTimeoutMs?: number
  shutdownTimeoutMs?: number
  disposeEofGraceMs?: number
  disposeGraceMs?: number
}

/** Node argv plus internal profile patches required by one resolved dsh entry. */
export interface DshNodeLaunch {
  /** Arguments before the profile selector. */
  nodeArgs: string[]
  /** Internal patches applied below caller-supplied patches. */
  patches: string[]
  /** Environment values required by the resolved entry mode. */
  environment: NodeJS.ProcessEnv
}

interface PackageManifest {
  version?: unknown
  bin?: unknown
}

/** Read a package manifest from one resolved package.json URL. */
function manifest(url: string): PackageManifest {
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')) as PackageManifest
}

/**
 * Resolve and version-check a dsh executable from package manifests.
 * @param dshManifestUrl - resolved URL of the dsh package manifest.
 * @param clientManifestUrl - resolved URL of the SDK client manifest.
 * @param language - diagnostic language for manifest failures.
 * @returns the absolute dsh executable path.
 */
export function resolveDshBinFromManifests(
  dshManifestUrl: string,
  clientManifestUrl: string,
  language: DiagnosticLocale = defaultDiagnosticLocale(),
): string {
  const dshManifest = manifest(dshManifestUrl)
  const clientManifest = manifest(clientManifestUrl)
  if (typeof dshManifest.version !== 'string' || dshManifest.version !== clientManifest.version) {
    throw new Error(diagnostics[language].version(String(clientManifest.version), String(dshManifest.version)))
  }
  const bin = typeof dshManifest.bin === 'object' && dshManifest.bin !== null
    ? (dshManifest.bin as Record<string, unknown>).dsh
    : dshManifest.bin
  if (typeof bin !== 'string' || bin === '') throw new Error(diagnostics[language].noExecutable())
  return resolve(dirname(fileURLToPath(dshManifestUrl)), bin)
}

/**
 * Resolve and version-check the built dsh executable installed with this SDK.
 * @param language - diagnostic language for manifest failures.
 * @returns the absolute built executable path, whether or not it exists in a source checkout.
 */
export function installedDshBin(language: DiagnosticLocale = defaultDiagnosticLocale()): string {
  return resolveDshBinFromManifests(
    import.meta.resolve('@deepseek-ai/dsh/package.json'),
    new URL('../package.json', import.meta.url).href,
    language,
  )
}

/**
 * Resolve the Node launch for one same-version dsh package.
 * @param dshManifestUrl - resolved URL of the dsh package manifest.
 * @param clientManifestUrl - resolved URL of the SDK client manifest.
 * @param sourceLoaderUrl - optional absolute tsx loader URL for deterministic tests.
 * @param language - diagnostic language for launch failures.
 * @returns built output, or the source entry plus its compatibility patch and tsx environment.
 */
export function resolveDshNodeLaunchFromManifests(
  dshManifestUrl: string,
  clientManifestUrl: string,
  sourceLoaderUrl?: string,
  language: DiagnosticLocale = defaultDiagnosticLocale(),
): DshNodeLaunch {
  const bin = resolveDshBinFromManifests(dshManifestUrl, clientManifestUrl, language)
  if (existsSync(bin)) return { nodeArgs: [bin], patches: [], environment: {} }

  const packageDir = dirname(fileURLToPath(dshManifestUrl))
  const sourceBin = resolve(packageDir, 'src/bin.ts')
  const sourcePatch = resolve(packageDir, 'src/sdk-source.cordis.patch.yml')
  const sourceTsconfig = resolve(packageDir, 'tsconfig.json')
  if (!existsSync(sourceBin) || !existsSync(sourcePatch) || !existsSync(sourceTsconfig)) {
    throw new Error(
      diagnostics[language].missingExecutable(bin, sourceBin, sourcePatch, sourceTsconfig),
    )
  }
  const loader = sourceLoaderUrl ?? import.meta.resolve('tsx/esm')
  return {
    nodeArgs: ['--import', loader, sourceBin],
    patches: [sourcePatch],
    environment: { TSX_TSCONFIG_PATH: sourceTsconfig },
  }
}

/**
 * Resolve the installed dsh package to a built or source Node launch.
 * @returns the launch descriptor for the current checkout or installed package.
 */
function installedDshNodeLaunch(language: DiagnosticLocale): DshNodeLaunch {
  return resolveDshNodeLaunchFromManifests(
    import.meta.resolve('@deepseek-ai/dsh/package.json'),
    new URL('../package.json', import.meta.url).href,
    undefined,
    language,
  )
}

/**
 * Resolve caller-relative filesystem inputs and construct canonical dsh argv.
 * @param options - public SDK launch options.
 * @param callerCwd - parent-process directory used for lexical resolution.
 * @returns one generic subprocess spec for the JSON-RPC transport.
 */
export function resolveDshLaunch(
  options: HarnessClientOptions = {},
  callerCwd: string = process.cwd(),
): RuntimeProcessOptions {
  const language = options.language ?? resolveDiagnosticLocale(options.env ?? process.env, Intl.DateTimeFormat().resolvedOptions().locale)
  const profile = options.profile ?? 'sdk'
  const dshLaunch = options.dshBin === undefined
    ? installedDshNodeLaunch(language)
    : { nodeArgs: [resolve(callerCwd, options.dshBin)], patches: [], environment: {} }
  const patches = [
    ...dshLaunch.patches,
    ...(options.patches ?? []).map(path => resolve(callerCwd, path)),
  ]
  const dshHome = options.dshHome === undefined ? undefined : resolve(callerCwd, options.dshHome)
  return {
    language,
    command: process.execPath,
    args: [...dshLaunch.nodeArgs, '--profile', profile, ...patches.flatMap(path => ['--patch', path])],
    ...options.processCwd === undefined ? {} : { cwd: resolve(callerCwd, options.processCwd) },
    environment: () => ({
      ...(options.env ?? process.env),
      ...dshLaunch.environment,
      DSH_LANG: language,
      ...dshHome === undefined ? {} : { DSH_HOME: dshHome },
    }),
    description: diagnostics[language].profile(JSON.stringify(profile)),
    initializeTimeoutMs: options.initializeTimeoutMs ?? DEFAULT_INITIALIZE_TIMEOUT_MS,
    ...options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs },
    ...options.shutdownTimeoutMs === undefined ? {} : { shutdownTimeoutMs: options.shutdownTimeoutMs },
    ...options.disposeEofGraceMs === undefined ? {} : { disposeEofGraceMs: options.disposeEofGraceMs },
    ...options.disposeGraceMs === undefined ? {} : { disposeGraceMs: options.disposeGraceMs },
  }
}
