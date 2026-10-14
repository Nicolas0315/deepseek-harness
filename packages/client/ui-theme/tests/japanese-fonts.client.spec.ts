/** Japanese glyph families follow the document language while custom font lists keep priority. */
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { parseRules } from './stylesheet-scan.ts'

it('puts Japanese families before Chinese fallbacks for text and code without overriding user lists', () => {
  const rules = parseRules(readFileSync(new URL('../src/styles/base.css', import.meta.url), 'utf8'))
  const japanese = rules.find(rule => rule.selectors.includes(':root:lang(ja)'))
  expect(japanese).toBeDefined()
  for (const role of ['text', 'code']) {
    const stack = japanese?.declarations.find(([name]) => name === `--dsh-font-family-${role}-default`)?.[1] ?? ''
    expect(stack).toContain("'Hiragino Sans'")
    expect(stack).toContain("'Yu Gothic UI'")
    expect(stack).toContain("'Meiryo'")
    expect(stack.indexOf("'Yu Gothic UI'")).toBeLessThan(stack.indexOf("'Microsoft YaHei'"))
    expect(japanese?.declarations.some(([name]) => name === `--dsh-font-family-${role}`)).toBe(false)
  }
  const body = rules.find(rule => rule.selectors.includes('body'))
  expect(body?.declarations.find(([name]) => name === '--dsw-font-family')?.[1])
    .toContain('var(--dsh-font-family-text,')
})
