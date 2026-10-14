/** Installer locale registrations keep every error, action, and format parameter translated. */
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('provides the complete Japanese installer copy and preserves format parameters', () => {
  const source = readFileSync(new URL('../installer/strings.nsh', import.meta.url), 'utf8')
  const dictionaries = new Map<string, Map<string, string>>()
  for (const match of source.matchAll(/^LangString (\w+) \$\{LANG_(\w+)\} "(.*)"$/gmu)) {
    const entries = dictionaries.get(match[2]!) ?? new Map<string, string>()
    entries.set(match[1]!, match[3]!)
    dictionaries.set(match[2]!, entries)
  }
  const english = dictionaries.get('ENGLISH')!
  const japanese = dictionaries.get('JAPANESE') ?? new Map<string, string>()
  expect(english.size).toBeGreaterThan(20)
  expect([...japanese.keys()].sort()).toEqual([...english.keys()].sort())
  for (const [key, text] of english) {
    expect(japanese.get(key)?.match(/%[ds%]/gu) ?? [], key).toEqual(text.match(/%[ds%]/gu) ?? [])
    expect(japanese.get(key)?.trim(), key).not.toBe('')
  }
})

it('uses the Japanese font selection in both native drawing paths', () => {
  const source = readFileSync(new URL('../installer/strings.nsh', import.meta.url), 'utf8')
  expect(source).toContain('LangString INSTALLER_FONT_FACE ${LANG_JAPANESE} "Yu Gothic UI"')
  expect(source).toContain('LangString INSTALLER_FONT_FACE ${LANG_ENGLISH} "Microsoft YaHei UI"')
  const drawing = readFileSync(new URL('../installer/drawing.nsh', import.meta.url), 'utf8')
  const lifecycle = readFileSync(new URL('../installer/lifecycle.nsh', import.meta.url), 'utf8')
  expect(drawing).toContain('$(INSTALLER_FONT_FACE)')
  expect(lifecycle).toContain('w "$(INSTALLER_FONT_FACE)"')
})
