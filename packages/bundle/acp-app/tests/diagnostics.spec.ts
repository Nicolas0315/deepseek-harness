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
      expect(translated, key).not.toBe(original)
    }
  })
})
