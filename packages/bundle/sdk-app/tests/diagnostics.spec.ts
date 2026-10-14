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
      if (typeof original === 'function' && typeof translated === 'function') {
        expect(translated.length, key).toBe(original.length)
        const parameters = Array.from({ length: original.length }, (_, index) => `${language}の値${String(index)}`)
        const englishText: unknown = Reflect.apply(original, undefined, parameters)
        const localizedText: unknown = Reflect.apply(translated, undefined, parameters)
        expect(typeof localizedText, key).toBe('string')
        if (typeof englishText === 'string' && typeof localizedText === 'string') {
          for (const parameter of parameters) {
            if (englishText.includes(parameter)) expect(localizedText, key).toContain(parameter)
          }
        }
      }
    }
  })
})
