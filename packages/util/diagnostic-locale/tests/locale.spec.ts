import { describe, expect, it } from 'vitest'
import { resolveDiagnosticLocale } from '../src/index.ts'

describe('diagnostic language selection', () => {
  it.each([
    [{}, 'ja-JP', 'ja'],
    [{}, 'Japanese_Japan', 'ja'],
    [{ LANG: 'Japanese_Japan.932' }, 'en-US', 'ja'],
    [{ LANG: 'ja_JP.UTF-8' }, 'en-US', 'ja'],
    [{ LANG: 'ja_JP@calendar=japanese', LC_MESSAGES: 'en_US.UTF-8' }, 'ja-JP', 'en'],
    [{ LANG: 'en_US.UTF-8', LC_MESSAGES: 'ja_JP.UTF-8' }, 'en-US', 'ja'],
    [{ LANG: 'ja_JP.UTF-8', LC_ALL: 'C' }, 'ja-JP', 'en'],
    [{ LC_ALL: 'en_US.UTF-8', DSH_LANG: 'JA-jp' }, 'en-US', 'ja'],
    [{ LANG: 'ja_JP.UTF-8', DSH_LANG: 'en' }, 'ja-JP', 'en'],
    [{ DSH_LANG: '', LC_ALL: '', LANG: 'ja_JP.UTF-8' }, 'en-US', 'ja'],
    [{ DSH_LANG: 'fr-FR', LANG: 'ja_JP.UTF-8' }, 'ja-JP', 'en'],
  ] as const)('resolves %j with system locale %s to %s', (environment, systemLocale, expected) => {
    expect(resolveDiagnosticLocale(environment, systemLocale)).toBe(expected)
  })
})
