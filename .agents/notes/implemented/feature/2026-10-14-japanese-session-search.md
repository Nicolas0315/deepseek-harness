# Agent Note: Japanese session content search

Status: implemented

English | [中文](2026-10-14-japanese-session-search.zh.md)

## Problem

SQLite FTS5's `unicode61` tokenizer treats an unspaced Japanese sentence as a single token. Searching for `日本語` therefore misses `これは日本語の文章です`, although a full-sentence query succeeds. Session content search needs one- and two-character recall, compatibility kana matching, and mixed Japanese/Latin text without changing Latin whole-token matching or the authoritative Session log.

## Decision

The SQLite query provider retains its original text column and adds an indexed Japanese projection only for documents containing Japanese characters. NFKC normalization operates on source graphemes; Japanese characters become separate FTS tokens while Latin and numeric runs remain whole. Ideographic variation selectors are omitted from the projection. Original and projected literal phrases are ORed with explicit column restrictions; neither branch interprets caller text as query syntax. Both persisted and live documents receive the two columns in their existing reconciliation transaction.

Ranking uses the larger highlighted occurrence count from the original and projected columns, avoiding duplicate credit when both find the same text. Document length remains the original code-point length. Snippet positions map projected matches back to original graphemes, so compatibility expansions, decomposed dakuten, supplementary characters, and variation selectors cannot leak normalized characters or inserted separators into displayed text. Cursor identities, generation changes, live shadowing, and pagination retain their existing rules.

The disposable index uses monotonic schema version 9. Existing ownership checks permit rebuilding recognized older derived indexes from Session data; no Session generation, event type, public request, or response field changes. [The package reference](../../../../packages/session-query/session-query-sqlite/README.md) owns configuration and search semantics.

## Alternatives considered

**Replace `unicode61` with trigram.** SQLite's trigram full-text queries cannot match fewer than three Unicode characters, excluding ordinary Japanese searches such as `日` and `日本`. A blanket replacement also changes Latin substring recall, including `AI` inside `BRAID`.

**Split every document into characters.** Splitting Latin text would change existing whole-token and phrase semantics and multiply index entries for English-only history. Restricting the auxiliary column to Japanese documents preserves the original English corpus and its ranking.

**Scan all document bodies.** Literal scanning avoids an index projection but makes each query proportional to the complete corpus. Indexed candidate retrieval keeps the existing query model; only matching result snippets need an original-position map.

**Add a morphological analyzer.** Word segmentation introduces dictionaries and an additional language-dependent runtime without supplying the required arbitrary short character phrases. Reading conversion and cross-script transliteration remain outside this search behavior.

## Consequences

Japanese documents require additional indexed text and normalization work when reconciled. English-only documents keep an empty auxiliary column. Queries remain synchronous SQLite operations; this decision does not remove that blocking cost. The projection expands indexed recall without mutating original text, and preserves Latin whole-token semantics in mixed text.

Focused projection and service tests cover Japanese phrase recall, one- and two-character queries, halfwidth kana, decomposed dakuten, supplementary Han, variation selectors, original snippet positions, and Latin non-matches. Real JSONL integration exercises persisted recall and index reconstruction while checking that the canonical source bytes stay unchanged. Browser tests exercise the assembled content-search path with Japanese settings; their expected UI output belongs to the owning Web tests because seeded history is not a recorded Session replay round trip.
