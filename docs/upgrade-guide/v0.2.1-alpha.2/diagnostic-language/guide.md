---
kind: upgrade-guide
description: "CLI and SDK diagnostic messages now follow Japanese language preferences instead of always using English."
---

# CLI and SDK diagnostic language

English | [中文](guide.zh.md)

## Change

CLI help, startup reports, and SDK-owned human-readable errors now select Japanese on a Japanese environment. The first nonblank value from `DSH_LANG`, `LC_ALL`, `LC_MESSAGES`, and `LANG` wins over the operating-system locale. Other languages select English. TypeScript and Python SDK operations can explicitly select `en` or `ja` without changing the parent process environment.

Command names, flags, JSON keys, error codes, JSON-RPC methods and data, and external diagnostic text keep their existing values. Applications that compare full English error messages or scrape human-readable CLI output are affected.

## Migration

1. Set `DSH_LANG=en` for scripts that require the previous English output; prefer stable codes and machine-readable output over parsing prose.
2. Set the TypeScript SDK's `language: 'ja'` or Python SDK's `language="ja"` option for an explicit per-instance choice. Python standalone Office and runtime-resource helpers accept the same explicit language with their operation options.
3. Run `DSH_LANG=ja dsh --help` and verify Japanese help. Repeat with `DSH_LANG=en` to verify the English override. Check the SDK error code separately from its localized message.
