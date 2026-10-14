import { describe, expect, it } from 'vitest'
import { Command } from 'commander'
import { configureCommandLocale, formatCommandError } from '../src/diagnostics.ts'

describe('Japanese command reports', () => {
  it('uses public help titles while retaining command grammar and English output', () => {
    const english = new Command().name('dsh 日本語').argument('[task]', 'task').option('--json', 'json')
    const japanese = new Command().name('dsh 日本語').argument('[task]', 'タスク').option('--json', 'JSON')
    configureCommandLocale(english, 'en')
    configureCommandLocale(japanese, 'ja')
    expect(english.helpInformation()).toContain('Usage: dsh 日本語')
    expect(japanese.helpInformation()).toContain('使い方: dsh 日本語')
    expect(japanese.helpInformation()).toContain('引数:')
    expect(japanese.helpInformation()).toContain('オプション:')
  })

  it('uses a structured Commander code and preserves its original diagnostic', () => {
    const original = "error: unknown option '--日本語'"
    expect(formatCommandError('ja', original, 'commander.unknownOption')).toBe(
      `指定したオプションは使用できません。--help で使用可能なオプションを確認してください。\nCommander 原文: ${original}`,
    )
    expect(formatCommandError('ja', '日本語の詳細', 'commander.error')).toBe('日本語の詳細')
    expect(formatCommandError('en', original, 'commander.unknownOption')).toBe(original)
  })
})

it('resolves independent immutable launch environments without changing the process locale', async () => {
  const { Context } = await import('@deepseek-ai/cordis')
  const { createLaunchEnvironmentSnapshot } = await import('@deepseek-ai/dsh-launch-environment')
  const { resolveCommandLocale } = await import('../src/diagnostics.ts')
  const japanese = new Context()
  const english = new Context()
  const inherited = process.env.DSH_LANG
  try {
    japanese.provide('launchEnvironment', createLaunchEnvironmentSnapshot([{ source: 'process', values: { DSH_LANG: 'ja_JP.UTF-8' } }]))
    english.provide('launchEnvironment', createLaunchEnvironmentSnapshot([{ source: 'process', values: { DSH_LANG: 'en', LANG: 'ja_JP.UTF-8' } }]))
    expect(resolveCommandLocale(japanese)).toBe('ja')
    expect(resolveCommandLocale(english)).toBe('en')
    expect(process.env.DSH_LANG).toBe(inherited)
  } finally {
    await japanese.fiber.dispose()
    await english.fiber.dispose()
  }
})
