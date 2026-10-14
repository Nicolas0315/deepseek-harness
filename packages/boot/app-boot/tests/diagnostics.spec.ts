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
