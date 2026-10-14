/** Profile package management and explicit, exact-version compatibility approvals. */
import { diagnosticMessages } from './diagnostics.ts'
import { runPluginCommand, runProfilePnpm, setProfileVersionExemption, type PackageOperationOptions } from '@deepseek-ai/dsh-plugin-manager/operations'
import { INSTALL_ANCHOR } from './profile-boot.ts'
import { DEFAULT_PROFILE_BUNDLES, initProfile, PROFILE_TEMPLATES, readProfileCompatibility, resolveProfileDir, type ProfileContext } from '@deepseek-ai/dsh-app-boot'
import { withFileLock } from '@deepseek-ai/dsh-atomic-write'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

function requireDesktopProfile(dir: string): void {
  const messages = diagnosticMessages()
  if (!existsSync(join(dir, 'package.json'))) {
    throw new Error(messages.openDeepSeekHarnessDesktopOnceToInitializeItsProfile)
  }
}

/** Parse only DSH-owned commands; all other arguments remain pnpm's responsibility. */
async function versionCommand(profile: string, args: readonly string[]): Promise<number | undefined> {
  const messages = diagnosticMessages()
  const [command, ...rest] = args
  if (command !== 'allow-version' && command !== 'revoke-version' && command !== 'version-exemptions') return undefined
  try {
    let packageVersion: string | undefined
    let runtimeVersion: string | undefined
    let acceptRisk = false
    const argumentsIterator = rest.values()
    for (const argument of argumentsIterator) {
      if (argument === '--accept-risk' && command === 'allow-version' && !acceptRisk) acceptRisk = true
      else if (argument === '--dsh-version' && runtimeVersion === undefined) runtimeVersion = argumentsIterator.next().value
      else if (argument.startsWith('--dsh-version=') && runtimeVersion === undefined) runtimeVersion = argument.slice('--dsh-version='.length)
      else if (!argument.startsWith('-') && packageVersion === undefined) packageVersion = argument
      else throw new Error(messages.unexpectedArgument(JSON.stringify(argument)))
    }
    if (command === 'version-exemptions' && rest.length > 0) throw new Error(messages.usageDshPluginVersionExemptions)
    let request: { packageVersion: string; runtimeVersion: string } | undefined
    if (command !== 'version-exemptions') {
      if (packageVersion === undefined || runtimeVersion === undefined) {
        throw new Error(messages.usageDshPluginPackageVersionDshVersionExact(command, command === 'allow-version' ? ' --accept-risk' : ''))
      }
      request = { packageVersion, runtimeVersion }
    }
    if (command === 'allow-version') {
      process.stderr.write(messages.compatibilityRisk)
    }
    const dir = resolveProfileDir(profile)
    if (profile !== 'desktop') await mkdir(dir, { recursive: true })
    await withFileLock(join(dir, 'package.json'), async () => {
      if (profile === 'desktop') requireDesktopProfile(dir)
      else if (!existsSync(join(dir, 'package.json'))) initProfile(dir, PROFILE_TEMPLATES[profile]?.bundles ?? DEFAULT_PROFILE_BUNDLES)
      if (request === undefined) {
        const { exemptions, warnings } = readProfileCompatibility(dir)
        for (const warning of warnings) process.stderr.write(messages.warning(warning))
        process.stdout.write(JSON.stringify(exemptions, undefined, 2) + '\n')
      } else {
        await setProfileVersionExemption(dir, request.packageVersion, request.runtimeVersion, command === 'allow-version', acceptRisk)
        process.stdout.write(messages.exemptionChanged(command === 'allow-version' ? messages.allowed : messages.revoked, request.packageVersion, request.runtimeVersion))
      }
    }, { waitMs: 120000 })
    return 0
  } catch (error) {
    process.stderr.write(`dsh: ${String(error)}\n`)
    return 1
  }
}

/** Run package management for a profile.
 * @param profile Profile name; Desktop's reserved profile must already be initialized by the application.
 * @param args DSH exemption command or pnpm arguments relative to the invoking directory.
 * @param packageManager Installation-owned executable and environment for pnpm operations.
 * @returns Zero on success; nonzero on invalid approval or package-manager failure.
 */
export async function runPlugin(profile: string, args: readonly string[], packageManager?: ProfileContext['packageManager']): Promise<number> {
  const messages = diagnosticMessages()
  if (profile === 'desktop') {
    try { requireDesktopProfile(resolveProfileDir(profile)) } catch (error) {
      process.stderr.write(`dsh: ${String(error)}\n`)
      return 1
    }
  }
  const versionResult = await versionCommand(profile, args)
  if (versionResult !== undefined) return versionResult
  const dir = resolveProfileDir(profile)
  if (existsSync(join(dir, 'package.json'))) {
    for (const warning of readProfileCompatibility(dir).warnings) process.stderr.write(messages.warning(warning))
  }
  const context = { profile, dir, installAnchor: INSTALL_ANCHOR, cwd: process.cwd() }
  const options: PackageOperationOptions = {
    ...packageManager,
    execution: 'cli',
    outputBytes: 16384,
    lockWaitMs: 120000,
    lookupTimeoutMs: 120000,
    onOutput: (text, stream) => { process[stream].write(text) },
  }
  const result = profile === 'desktop'
    ? await withFileLock(join(dir, 'package.json'), async () => {
      requireDesktopProfile(dir)
      return runProfilePnpm(context, args, options)
    }, { waitMs: 120000 })
    : await runPluginCommand(context, args, options)
  if (result.exitCode === 127) process.stderr.write(messages.pnpmMissing)
  for (const { name, version, runtimeVersion } of result.incompatible ?? []) {
    process.stderr.write(messages.acceptVersionRisk(profile, name, version, runtimeVersion))
  }
  if (result.exitCode !== 0) process.stderr.write(messages.pluginFailed(result.logPath))
  if (result.exitCode !== 0 && args.some(argument => /^git\+|^github:|\.git(?:#|$)/.test(argument))) {
    process.stderr.write(messages.gitBuildApproval(join(resolveProfileDir(profile), 'pnpm-workspace.yaml')))
  }
  return result.exitCode
}
