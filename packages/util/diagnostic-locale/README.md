---
description: "Language selection for CLI and SDK diagnostic catalogs."
kind: "package-library"
---

# dsh-diagnostic-locale

English | [中文](README.zh.md)

## Summary

This stateless library selects English or Japanese for CLI and SDK diagnostics. Each consumer owns its messages, captures its effective environment and operating-system locale, and calls `resolveDiagnosticLocale(environment, systemLocale)`. The library reads no process state and changes no environment variables.

## Table of Contents

- [API](#api)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="api"></a>
## API

`DiagnosticLocale` is `en | ja`. `resolveDiagnosticLocale` selects the first nonblank value from `DSH_LANG`, `LC_ALL`, `LC_MESSAGES` and `LANG`, then the supplied system locale. A `ja` primary language selects Japanese, including `ja-JP` and `ja_JP.UTF-8`; the legacy Windows spelling `Japanese_Japan` also selects Japanese. Other values, including `C` and `POSIX`, select English. An explicit `DSH_LANG=en` therefore preserves English diagnostics on a Japanese system.

This selection affects human-readable explanations. Consumers retain command names, paths, protocol fields, error codes and external diagnostic text. GUI preferences remain owned by [client locale](../../client/locale/README.md).

<a id="model-experience"></a>
## Model Experience

None, as the library selects diagnostic language without registering model-facing messages or Session events.

#### KV Cache effect

None; no text reaches a model through this library.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Catalogs remain consumer-owned** — this library supplies no translations for provider, operating-system or package-manager errors.
- **English and Japanese only** — other diagnostic languages select English; GUI language packs have a separate registry.

<a id="dev-note"></a>
### Dev Note

None.
