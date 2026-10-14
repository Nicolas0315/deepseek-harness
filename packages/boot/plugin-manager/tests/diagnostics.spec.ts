import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { diagnosticMessages } from '../src/diagnostics.ts'

describe('diagnostic catalogs', () => {
  it('keeps every English entry and parameter available in Japanese', () => {
    const english = diagnosticMessages('en')
    const japanese = diagnosticMessages('ja')
    expect(Object.keys(japanese)).toEqual(Object.keys(english))
    for (const [key, original] of Object.entries(english)) {
      const translated = japanese[key as keyof typeof japanese]
      expect(typeof translated, key).toBe(typeof original)
      if (typeof original === 'function' && typeof translated === 'function') {
        expect(translated.length, key).toBe(original.length)
        const parameters = Array.from({ length: original.length }, (_, index) => `日本語の値${String(index)}`)
        const englishText: unknown = Reflect.apply(original, undefined, parameters)
        const japaneseText: unknown = Reflect.apply(translated, undefined, parameters)
        expect(typeof japaneseText, key).toBe('string')
        if (typeof englishText === 'string' && typeof japaneseText === 'string') {
          for (const parameter of parameters) {
            if (englishText.includes(parameter)) expect(japaneseText, key).toContain(parameter)
          }
        }
      }
    }
  })
})

it('uses the package operation environment for notices and preserves child stderr', async () => {
  const { runPluginCommand } = await import('../src/operations.ts')
  const root = await mkdtemp(join(tmpdir(), 'dsh-日本語 パッケージ-'))
  try {
    const script = join(root, '外部診断.mjs')
    await writeFile(script, "process.stderr.write('external dependency diagnostic: 日本語\\n'); process.exitCode = 1\n")
    let reported = ''
    const result = await runPluginCommand({ profile: 'jp-test', home: root, cwd: root, installAnchor: script }, ['--version'], {
      command: process.execPath,
      args: [script],
      env: { DSH_LANG: 'ja' },
      execution: 'service',
      outputBytes: 1024,
      onOutput: (text) => { reported += text },
    })
    expect(result.exitCode).toBe(1)
    expect(reported).toContain(`dsh: プロファイル jp-test を ${join(root, 'profiles', 'jp-test')} に作成しました`)
    expect(result.output).toBe('external dependency diagnostic: 日本語\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it('passes the captured operation language to profile validation despite an English child environment', async () => {
  const { runProfilePnpm } = await import('../src/operations.ts')
  const root = await mkdtemp(join(tmpdir(), 'dsh-operation-locale-'))
  try {
    const filename = join(root, 'package.json')
    await writeFile(filename, '[]\n')
    await expect(runProfilePnpm({ profile: 'test', dir: root, cwd: root, installAnchor: filename }, [], {
      execution: 'service', outputBytes: 1024, env: { DSH_LANG: 'en' }, diagnosticLocale: 'ja',
    })).rejects.toThrow(`dsh: プロファイルのマニフェスト ${filename} は JSON オブジェクトにしてください`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
