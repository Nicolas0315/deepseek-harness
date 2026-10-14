import { describe, expect, it } from 'vitest'
import { en, formatDesktopMessage, resolveDesktopLocale, resolveDesktopStartupLocale, ja, zh } from '../src/locale.ts'

describe('desktop locale dictionaries', () => {
  it('ships the same key set in English, Chinese, and Japanese', () => {
    expect(Object.keys(zh)).toEqual(Object.keys(en))
    expect(Object.keys(ja)).toEqual(Object.keys(en))
    expect(resolveDesktopLocale('ja').messages).toEqual(ja)
    expect(resolveDesktopLocale('ja-JP').messages).toEqual(ja)
    expect(resolveDesktopLocale('zh-Hans-CN').messages).toEqual(zh)
    expect(resolveDesktopLocale('en-US').messages).toEqual(en)
    expect(resolveDesktopLocale('fr-FR').messages).toEqual(en)
  })

  it('preserves named placeholders across shipped dictionaries', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const placeholders = (value: string) => [...value.matchAll(/\{[^{}]+\}/gu)].map(([token]) => token).sort()
      expect(placeholders(ja[key]), key).toEqual(placeholders(en[key]))
    }
    expect(ja.updateDownloadedDetailWindows).toContain('\n\n')
  })

  it('formats named values without consuming unknown placeholders', () => {
    expect(formatDesktopMessage('{name}@{version} {missing}', { name: 'plugin', version: '1.2.3' }))
      .toBe('plugin@1.2.3 {missing}')
  })

  it('prefers an explicit supported choice, then the first supported system language', () => {
    expect(resolveDesktopStartupLocale('zh', ['en-US']).id).toBe('zh-CN')
    expect(resolveDesktopStartupLocale('EN', ['zh-CN']).id).toBe('en')
    expect(resolveDesktopStartupLocale(null, ['ja-JP', 'zh-Hant', 'en-US']).id).toBe('ja-JP')
    expect(resolveDesktopStartupLocale(null, ['en-US', 'zh-CN']).id).toBe('en')
    expect(resolveDesktopStartupLocale(null, ['ja-JP']).id).toBe('ja-JP')
    expect(resolveDesktopStartupLocale(null, []).id).toBe('en')
    expect(resolveDesktopStartupLocale('ja', ['zh-CN']).id).toBe('ja-JP')
    expect(resolveDesktopStartupLocale('ja-JP', ['en-US']).id).toBe('ja-JP')
    expect(resolveDesktopStartupLocale(null, ['fr-FR', 'ja-JP']).id).toBe('ja-JP')
    expect(resolveDesktopStartupLocale(null, ['fr-FR']).id).toBe('en')
  })

})
