/** Japanese FTS projection; original text remains the only snippet source. */

import { FTS_HIGHLIGHT_START } from './query.ts'

const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u
const japaneseCharacters = /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー])/gu
const variationSelector = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu
const graphemes = new Intl.Segmenter('ja', { granularity: 'grapheme' })

/**
 * Separate Japanese graphemes and normalize compatibility characters for FTS5.
 * Latin and numeric runs remain whole; already-normalized non-Japanese documents need no copy.
 * @param text - original sanitized document or query.
 * @returns auxiliary indexed text, or empty text when neither Japanese script nor compatibility normalization is needed.
 */
export function japaneseSearchText(text: string): string {
  if (japanese.test(text)) return project(text)
  const normalized = text.normalize('NFKC')
  return normalized === text ? '' : normalized
}

/**
 * Project query text even when it contains only a Latin token adjacent to Japanese in documents.
 * @param text - normalized literal caller query.
 * @returns compatibility-normalized text with Japanese character separators.
 */
export function japaneseSearchQuery(text: string): string {
  return project(text)
}

/**
 * Position a snippet in original text using the first highlighted projected match.
 * @param text - unmarked original document text.
 * @param highlighted - FTS5-highlighted auxiliary column.
 * @returns original text with a start marker at the matching original grapheme.
 */
export function markJapaneseMatch(text: string, highlighted: string): string {
  const markerIndex = highlighted.indexOf(FTS_HIGHLIGHT_START)
  if (markerIndex < 0) return text
  const projectedOffset = Array.from(highlighted.slice(0, markerIndex)).length
  const offsets: number[] = []
  project(text, offsets)
  const offset = offsets[projectedOffset] as number
  const characters = Array.from(text)
  characters.splice(offset, 0, FTS_HIGHLIGHT_START)
  return characters.join('')
}

function project(text: string, offsets?: number[]): string {
  if (offsets === undefined && text === text.normalize('NFKC')) {
    return text.replace(variationSelector, '').replace(japaneseCharacters, ' $1 ')
  }
  const characters: string[] = []
  let offset = 0
  for (const { segment } of graphemes.segment(text)) {
    const normalized = segment.normalize('NFKC').replace(variationSelector, '')
    const separated = normalized.replace(japaneseCharacters, ' $1 ')
    for (const character of separated) {
      characters.push(character)
      offsets?.push(offset)
    }
    if (offsets !== undefined) offset += Array.from(segment).length
  }
  return characters.join('')
}
