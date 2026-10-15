---
kind: upgrade-guide
description: "The derived Session search index rebuilds at schema version 9 to support Japanese phrases."
---

# Japanese Session search index

English | [中文](guide.zh.md)

## Change

The SQLite Session query provider upgrades its disposable search index from schema version 8 to 9. On opening a recognized older index, it rebuilds the index from Session history. The first content search may therefore take longer. Canonical Session logs, event formats, and returned text remain unchanged.

Japanese phrases, including one- and two-character queries, now match inside unspaced Japanese text. Search also matches compatibility kana and decomposed dakuten; snippets keep their original spelling. Latin token matching remains unchanged. Search stays opt-in through the provider's existing `openAt` configuration.

## Migration

1. Allow the provider to rebuild its owned derived index. Do not delete or rewrite Session logs.
2. After startup or the first search, query `日本語` in a conversation containing `これは日本語の文章です` and confirm the original text appears.
3. Keep `openAt: never` if the deployment intentionally disables content search; this upgrade does not enable it.
