import { describe, expect, it } from 'vitest'
import { diagnosticMessages } from '../src/diagnostics.ts'

describe('diagnostic catalogs', () => {
  it.each(['zh', 'ja'] as const)('keeps every English entry and parameter available in %s', (language) => {
    const english = diagnosticMessages('en')
    const localized = diagnosticMessages(language)
    expect(Object.keys(localized)).toEqual(Object.keys(english))
    for (const [key, original] of Object.entries(english)) {
      const translated = localized[key as keyof typeof localized]
      expect(typeof translated, key).toBe(typeof original)
      expect(translated, key).not.toBe(original)
    }
  })
})
