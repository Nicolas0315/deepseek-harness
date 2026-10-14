---
kind: upgrade-guide
description: "Typed client dictionary registrations require a Japanese dictionary alongside English and Chinese."
---

# Japanese client dictionaries

English | [中文](guide.zh.md)

## Change

`BuiltInLocaleId` includes `ja`. Client plugins using `ctx.locale.register(ns, { zh, en })` must supply a complete Japanese dictionary. Japanese is already registered as a selectable built-in language, so language packs cannot register its definition again. Browsers and native shells that prefer Japanese now select it automatically unless a stored preference overrides that choice.

## Migration

1. Add a `ja` dictionary with the namespace's existing keys and interpolation parameters, then call `ctx.locale.register(ns, { zh, en, ja })`.
2. Remove `ctx.locale.addLanguage({ id: 'ja', ... })` from Japanese language packs. A pack may still provide Japanese dictionaries for namespaces it owns using the single-locale registration form.
3. Rebuild the client plugin, select 日本語 in Settings → General, and verify its translated content. Select English or 中文 explicitly to retain that language on a Japanese system.
