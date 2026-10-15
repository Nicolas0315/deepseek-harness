/** Japanese reports through shipped profiles and the production source launcher. */
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url))
const sourceBin = join(repoRoot, 'apps/cli/src/bin.ts')

/** Execute one bounded invocation; execa owns termination and awaits child completion. */
async function launch(home: string, args: string[], language = 'ja') {
  const result = await execa(process.execPath, ['--import', 'tsx/esm', sourceBin, ...args], {
    cwd: repoRoot,
    input: '',
    env: { DSH_HOME: home, DSH_LANG: language, LC_ALL: 'en_US.UTF-8', DSH_TELEMETRY_DISABLED: '1' },
    reject: false,
    timeout: 25_000,
    killSignal: 'SIGKILL',
    stripFinalNewline: false,
  })
  expect(result.timedOut).toBe(false)
  expect(result.signal).toBeUndefined()
  return result
}

describe('Japanese source CLI', () => {
  it.each(['headless', 'web', 'sdk', 'acp'])('prints %s help from a Japanese home and overlay path', async (profile) => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-日本語 空白-'))
    try {
      const patch = join(home, '追加 設定.yml')
      await writeFile(patch, '[]\n')
      const result = await launch(home, [profile, '--patch', patch, '--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe('')
      const expected = await readFile(new URL(`./expected/japanese/${profile}-help.txt`, import.meta.url), 'utf8')
      expect(result.stdout).toBe(`${expected}\n`)
      const english = await launch(home, [profile, '--help'], 'en')
      expect(english.exitCode).toBe(0)
      expect(english.stdout).toContain(`Usage: dsh --profile ${profile}`)
      expect(english.stdout).toContain('show this help')
      expect(english.stderr).toBe('')
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  }, 30_000)

  it('keeps Japanese grammar errors inside the headless JSON event', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-日本語 JSON-'))
    try {
      const result = await launch(home, ['headless', '--json', '--未知のオプション', '日本語のタスク'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toBe('')
      const event: unknown = JSON.parse(result.stdout)
      expect(event).toEqual({
        type: 'error',
        message: "指定したオプションは使用できません。--help で使用可能なオプションを確認してください。\nCommander 原文: error: unknown option '--未知のオプション'",
      })
      const owned = await launch(home, ['headless', '--json', '--session-id', '', '日本語のタスク'])
      expect(owned.exitCode).toBe(1)
      expect(owned.stderr).toBe('')
      expect(JSON.parse(owned.stdout)).toEqual({ type: 'error', message: 'エラー: --session-id に空でないセッション ID を指定してください' })
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  }, 30_000)

  it('keeps external startup details while localizing audit groups and the saved report path', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-日本語 起動診断-'))
    try {
      const profile = join(home, 'profiles', 'jp-test')
      await mkdir(profile, { recursive: true })
      await writeFile(join(profile, 'package.json'), JSON.stringify({ name: 'jp-test', private: true, dsh: { profile: { bundles: [] } } }))
      await writeFile(join(profile, 'cordis.patch.yml'), '[]\n')
      const plugin = join(home, '起動失敗.mjs')
      await writeFile(plugin, "export function apply() { throw new Error('外部原文を保持: original dependency detail') }\n")
      const patch = join(home, '必須プラグイン.yml')
      await writeFile(patch, `- insert:\n    - id: webserver\n      name: ${JSON.stringify(plugin)}\n`)
      const result = await launch(home, ['jp-test', '--patch', patch])
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe('')
      expect(result.stderr).toContain('起動に失敗しました。必須プラグイン 1 件を有効化できませんでした')
      expect(result.stderr).toContain('失敗したプラグイン（1 件）:')
      expect(result.stderr).toContain('webserver（必須）')
      expect(result.stderr).toContain('外部原文を保持: original dependency detail')
      expect(result.stderr).toContain(`診断の全文: ${join(home, 'logs')}`)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  }, 30_000)
})
