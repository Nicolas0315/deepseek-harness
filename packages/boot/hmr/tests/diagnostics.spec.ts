/** Reload diagnostics use each launcher's language while retaining external data and machine reasons. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Timer from '@deepseek-ai/cordis-plugin-timer'
import { createLaunchEnvironmentSnapshot } from '@deepseek-ai/dsh-launch-environment'
import { FSWatcher } from 'chokidar'
import { expect, it, onTestFinished, vi } from 'vitest'
import Hmr from '../src/index.ts'
import { hmrMessages, resolveHmrLocale } from '../src/diagnostics.ts'
import { handleError } from '../src/error.ts'

const watchers = vi.hoisted(() => [] as FSWatcher[])
vi.mock('chokidar', async (original) => {
  const native = await original<typeof import('chokidar')>()
  return { ...native, watch: () => {
    const watcher = new native.FSWatcher()
    watchers.push(watcher)
    queueMicrotask(() => watcher.emit('ready'))
    return watcher
  } }
})

it.each([
  ['en', 'HMR profile reconciliation must run inside runExclusive', 'HMR profile reconciliation requires profileContext', 'HMR transactions cannot be nested', 'config reload at %C failed', 'File'],
  ['zh', 'HMR profile 重新组合必须在 runExclusive 内运行', 'HMR profile 重新组合需要 profileContext', 'HMR 事务不能嵌套', '重新加载 %C 处的配置失败', '文件'],
  ['ja', 'HMRのプロファイル再構成は runExclusive 内で実行してください', 'HMRのプロファイル再構成には profileContext が必要です', 'HMRのトランザクションは入れ子にできません', '%C の設定を再読み込みできませんでした', 'ファイル'],
] as const)('reports %s reload failures without changing paths or compiler errors', async (language, exclusive, profile, nested, configFailed, fileLabel) => {
  const dir = mkdtempSync(join(tmpdir(), 'hmr-locale-'))
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose(); rmSync(dir, { recursive: true, force: true }) })
  ctx.baseUrl = pathToFileURL(dir).href + '/'
  ctx.provide('launchEnvironment', createLaunchEnvironmentSnapshot([
    { source: 'process', values: { DSH_LANG: language, LC_ALL: 'en_US.UTF-8' } },
  ]))
  await ctx.plugin(Loader)
  await ctx.plugin(Timer)
  await ctx.plugin(Hmr, { root: [], ignored: [], debounce: 0 })
  const hmr = ctx.hmr
  await expect(hmr.reconcileProfile()).rejects.toThrow(exclusive)
  await expect(hmr.runExclusive(() => hmr.reconcileProfile())).rejects.toThrow(profile)
  await hmr.runExclusive(async () => {
    await expect(hmr.runExclusive(async () => {})).rejects.toThrow(nested)
  })
  const filename = join(dir, '日本語 中文 %s.yml')
  const external = new Error('external loader failure 日本語 中文 %s')
  const warn = vi.spyOn(ctx.logger, 'warn').mockImplementation(() => {})
  onTestFinished(() => { warn.mockRestore() })
  await hmr.watchConfig(filename, async () => { throw external })
  watchers.at(-1)!.emit('change', filename)
  await expect.poll(() => warn.mock.calls.length).toBe(2)
  expect(warn.mock.calls[0]).toEqual([configFailed, filename])
  expect(warn.mock.calls[1]).toEqual([external])
  writeFileSync(filename, 'const broken = ;\n')
  handleError(ctx, { errors: [{ text: 'external parser error', location: { file: filename, line: 1, column: 15 } }] })
  expect(warn).toHaveBeenCalledWith(expect.stringContaining(`${fileLabel}: ${filename}:1:15\n`))
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('external parser error'))
})

it('retains logger tokens and diagnostic arguments across every language', () => {
  const english = hmrMessages('en')
  for (const language of ['en', 'zh', 'ja'] as const) {
    const translated = hmrMessages(language)
    expect(Object.keys(translated)).toEqual(Object.keys(english))
    for (const key of Object.keys(english) as (keyof typeof english)[]) {
      const original = english[key]
      const localized = translated[key]
      if (typeof original === 'string' && typeof localized === 'string') {
        expect(localized.match(/%[a-zA-Z]/g) ?? [], key).toEqual(original.match(/%[a-zA-Z]/g) ?? [])
      } else if (typeof original === 'function' && typeof localized === 'function') {
        const args = Array.from({ length: original.length }, (_, index) => `原文 中文 ${String(index)} %s`)
        const result: unknown = Reflect.apply(localized, undefined, args)
        for (const argument of args) expect(result, key).toContain(argument)
      }
    }
  }
})

it('resolves independent launch snapshots without mutating the process language', async () => {
  const contexts = [new Context(), new Context(), new Context()]
  onTestFinished(async () => { for (const ctx of contexts) await ctx.fiber.dispose() })
  const [japanese, chinese, english] = contexts as [Context, Context, Context]
  japanese.provide('launchEnvironment', createLaunchEnvironmentSnapshot([{ source: 'process', values: { DSH_LANG: 'Japanese_Japan', LANG: 'zh_CN.UTF-8' } }]))
  chinese.provide('launchEnvironment', createLaunchEnvironmentSnapshot([{ source: 'process', values: { DSH_LANG: '', LC_MESSAGES: 'Chinese_China' } }]))
  english.provide('launchEnvironment', createLaunchEnvironmentSnapshot([{ source: 'process', values: { DSH_LANG: 'en', LANG: 'ja_JP.UTF-8' } }]))
  expect(contexts.map(resolveHmrLocale)).toEqual(['ja', 'zh', 'en'])
})
