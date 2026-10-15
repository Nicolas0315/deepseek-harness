/** Public dsh launch resolution for the TypeScript SDK. */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_INITIALIZE_TIMEOUT_MS,
  installedDshBin,
  resolveDshNodeLaunchFromManifests,
  resolveDshBinFromManifests,
  resolveDshLaunch,
} from '../src/launch.ts'

const cleanups: string[] = []
afterEach(() => {
  for (const path of cleanups.splice(0)) rmSync(path, { recursive: true, force: true })
})

function manifestPair(dsh: object, client: object): { dshUrl: string; clientUrl: string; root: string } {
  const root = mkdtempSync(join(tmpdir(), 'dsh-sdk-manifests-'))
  cleanups.push(root)
  const dshPath = join(root, 'dsh-package.json')
  const clientPath = join(root, 'client-package.json')
  writeFileSync(dshPath, JSON.stringify(dsh))
  writeFileSync(clientPath, JSON.stringify(client))
  return {
    dshUrl: pathToFileURL(dshPath).href,
    clientUrl: pathToFileURL(clientPath).href,
    root,
  }
}

describe('SDK dsh launch resolution', () => {
  it('resolves the same-version installed dsh entry by default', () => {
    const bin = installedDshBin('en')
    expect(bin.endsWith(join('apps', 'cli', 'lib', 'bin.js'))).toBe(true)
    const launch = resolveDshLaunch({ language: 'en' })
    expect(launch.command).toBe(process.execPath)
    expect(launch.args).toEqual(existsSync(bin)
      ? [bin, '--profile', 'sdk']
      : [
        '--import', import.meta.resolve('tsx/esm'), resolve(bin, '..', '..', 'src/bin.ts'),
        '--profile', 'sdk',
        '--patch', resolve(bin, '..', '..', 'src/sdk-source.cordis.patch.yml'),
      ])
    expect(launch.initializeTimeoutMs).toBe(DEFAULT_INITIALIZE_TIMEOUT_MS)
    expect(launch.description).toBe('dsh profile "sdk"')
  })

  it('makes every filesystem input absolute before spawn and preserves patch order', () => {
    const caller = resolve('/tmp', 'sdk-launch-caller')
    const launch = resolveDshLaunch({ language: 'en',
      dshBin: './bin/dsh',
      profile: 'custom-sdk',
      patches: ['./first.yml', '../second.yml'],
      dshHome: './home',
      processCwd: './worker',
      env: { PATH: '/bin', DSH_HOME: '/stale' },
      initializeTimeoutMs: 123,
      requestTimeoutMs: 456,
      shutdownTimeoutMs: 789,
      disposeEofGraceMs: 12,
      disposeGraceMs: 34,
    }, caller)
    expect(launch).toMatchObject({
      command: process.execPath,
      args: [
        join(caller, 'bin/dsh'),
        '--profile', 'custom-sdk',
        '--patch', join(caller, 'first.yml'),
        '--patch', resolve(caller, '../second.yml'),
      ],
      cwd: join(caller, 'worker'),
      description: 'dsh profile "custom-sdk"',
      initializeTimeoutMs: 123,
      requestTimeoutMs: 456,
      shutdownTimeoutMs: 789,
      disposeEofGraceMs: 12,
      disposeGraceMs: 34,
    })
    expect(launch.environment()).toEqual({ PATH: '/bin', DSH_HOME: join(caller, 'home'), DSH_LANG: 'en' })
  })

  it('falls back to the same package source entry through an absolute tsx loader', () => {
    const pair = manifestPair({ version: '1.0.0', bin: 'lib/bin.js' }, { version: '1.0.0' })
    const sourceBin = join(pair.root, 'src/bin.ts')
    const sourcePatch = join(pair.root, 'src/sdk-source.cordis.patch.yml')
    const sourceTsconfig = join(pair.root, 'tsconfig.json')
    mkdirSync(join(pair.root, 'src'))
    writeFileSync(sourceBin, '')
    writeFileSync(sourcePatch, '[]\n')
    writeFileSync(sourceTsconfig, '{}\n')

    expect(resolveDshNodeLaunchFromManifests(pair.dshUrl, pair.clientUrl, 'file:///tsx-loader.mjs', 'en'))
      .toEqual({
        nodeArgs: ['--import', 'file:///tsx-loader.mjs', sourceBin],
        patches: [sourcePatch],
        environment: { TSX_TSCONFIG_PATH: sourceTsconfig },
      })
    expect(resolveDshNodeLaunchFromManifests(pair.dshUrl, pair.clientUrl, undefined, 'en'))
      .toEqual({
        nodeArgs: ['--import', import.meta.resolve('tsx/esm'), sourceBin],
        patches: [sourcePatch],
        environment: { TSX_TSCONFIG_PATH: sourceTsconfig },
      })
  })

  it('uses the built entry when the manifest bin exists', () => {
    const pair = manifestPair({ version: '1.0.0', bin: 'lib/bin.js' }, { version: '1.0.0' })
    const bin = join(pair.root, 'lib/bin.js')
    mkdirSync(join(pair.root, 'lib'))
    writeFileSync(bin, '')

    expect(resolveDshNodeLaunchFromManifests(pair.dshUrl, pair.clientUrl, undefined, 'en')).toEqual({
      nodeArgs: [bin],
      patches: [],
      environment: {},
    })
  })

  it.each([0, 1, 2])('fails loud when a source launch is missing required file set %s', (presentCount) => {
    const pair = manifestPair({ version: '1.0.0', bin: 'lib/bin.js' }, { version: '1.0.0' })
    mkdirSync(join(pair.root, 'src'))
    const sourceFiles = ['src/bin.ts', 'src/sdk-source.cordis.patch.yml', 'tsconfig.json']
    for (const source of sourceFiles.slice(0, presentCount)) writeFileSync(join(pair.root, source), '')
    expect(() => resolveDshNodeLaunchFromManifests(pair.dshUrl, pair.clientUrl, 'file:///tsx-loader.mjs', 'en'))
      .toThrow('is missing its built executable')
  })

  it('reads explicit and inherited environments when the child starts', () => {
    const explicit: NodeJS.ProcessEnv = { MARKER: 'before' }
    const explicitLaunch = resolveDshLaunch({ language: 'en', dshBin: '/bin/dsh', env: explicit })
    explicit.MARKER = 'after'
    expect(explicitLaunch.environment().MARKER).toBe('after')

    const inheritedLaunch = resolveDshLaunch({ language: 'en', dshBin: '/bin/dsh' })
    process.env.DSH_SDK_LATE_ENV_TEST = 'late'
    try {
      expect(inheritedLaunch.environment().DSH_SDK_LATE_ENV_TEST).toBe('late')
    } finally {
      delete process.env.DSH_SDK_LATE_ENV_TEST
    }
  })

  it.each([2, '2.0.0'])(
    'rejects a dsh version that differs from the client (%j)',
    (version) => {
      const pair = manifestPair({ version, bin: 'bin.js' }, { version: '1.0.0' })
      expect(() => resolveDshBinFromManifests(pair.dshUrl, pair.clientUrl, 'en'))
        .toThrow(`requires the same dsh version, got ${String(version)}`)
    },
  )

  it('accepts the string npm bin form', () => {
    const pair = manifestPair({ version: '1.0.0', bin: './bin.js' }, { version: '1.0.0' })
    expect(resolveDshBinFromManifests(pair.dshUrl, pair.clientUrl, 'en')).toBe(join(pair.root, 'bin.js'))
  })

  it.each([null, {}, ''])(
    'rejects a manifest without a usable dsh executable (%j)',
    (bin) => {
      const pair = manifestPair({ version: '1.0.0', bin }, { version: '1.0.0' })
      expect(() => resolveDshBinFromManifests(pair.dshUrl, pair.clientUrl, 'en'))
        .toThrow('declares no dsh executable')
    },
  )

  it.each(['ja', 'zh'] as const)('localizes package resolution failures and preserves version/path values (%s)', (language) => {
    const pair = manifestPair({ version: '2.0.0', bin: 'bin.js' }, { version: '1.0.0' })
    expect(() => resolveDshBinFromManifests(pair.dshUrl, pair.clientUrl, language))
      .toThrow(language === 'ja' ? 'dsh SDK クライアント 1.0.0 には同じ dsh バージョンが必要です。実際: 2.0.0' : 'dsh SDK 客户端 1.0.0 需要相同的 dsh 版本，实际为 2.0.0')
    const missing = manifestPair({ version: '1.0.0' }, { version: '1.0.0' })
    expect(() => resolveDshBinFromManifests(missing.dshUrl, missing.clientUrl, language))
      .toThrow(language === 'ja' ? '@deepseek-ai/dsh に dsh 実行ファイルの宣言がありません' : '@deepseek-ai/dsh 未声明 dsh 可执行文件')
    const source = manifestPair({ version: '1.0.0', bin: 'lib/bin.js' }, { version: '1.0.0' })
    expect(() => resolveDshNodeLaunchFromManifests(source.dshUrl, source.clientUrl, undefined, language))
      .toThrow(language === 'ja'
        ? `@deepseek-ai/dsh のビルド済み実行ファイル ${join(source.root, 'lib/bin.js')} と起動に必要なソースファイル一式`
        : `@deepseek-ai/dsh 缺少已构建的可执行文件 ${join(source.root, 'lib/bin.js')} 和完整的源启动文件`)
  })

})
