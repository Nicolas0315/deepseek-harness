/** Japanese indexing and original-text snippet positioning. */
import { describe, expect, it } from 'vitest'
import { japaneseSearchQuery, japaneseSearchText, markJapaneseMatch } from '../src/japanese-search.ts'
import { FTS_HIGHLIGHT_START, FTS_HIGHLIGHT_END, makeSnippet } from '../src/query.ts'

const start = FTS_HIGHLIGHT_START
const end = FTS_HIGHLIGHT_END

describe('Japanese search projection', () => {
  it('indexes Japanese characters separately while preserving Latin and numeric runs', () => {
    expect(japaneseSearchText('English API BRAID 123')).toBe('')
    expect(japaneseSearchText('ＡＢＣ１２３')).toBe('ABC123')
    expect(japaneseSearchText('日本語APIを使う')).toBe(' 日  本  語 API を  使  う ')
    expect(japaneseSearchText('㌀')).toBe(' ア  パ  ー  ト ')
    expect(japaneseSearchQuery('API 123')).toBe('API 123')
    expect(japaneseSearchText('ｶﾞとカ\u3099と葛\u{E0100}と𠮷😀')).toBe(' ガ  と  ガ  と  葛  と  𠮷 😀')
  })

  it('centers excerpts on original code points after compatibility expansion, dakuten, and IVS', () => {
    const text = `${'前'.repeat(30)}ｶﾞとカ\u3099と葛\u{E0100}と𠮷😀${'後'.repeat(30)}`
    const projected = japaneseSearchText(text)
    for (const query of ['ガ', '葛', '𠮷']) {
      const marked = projected.replace(query, `${start}${query}${end}`)
      const snippet = makeSnippet(markJapaneseMatch(text, marked), 20)
      expect(Array.from(snippet).length).toBeLessThanOrEqual(20)
      expect(snippet).toContain(query === 'ガ' ? 'ｶﾞ' : query)
      expect(snippet).not.toContain(start)
      expect(snippet).not.toContain(' 葛 ')
    }
    expect(markJapaneseMatch(text, projected)).toBe(text)
  })
})
