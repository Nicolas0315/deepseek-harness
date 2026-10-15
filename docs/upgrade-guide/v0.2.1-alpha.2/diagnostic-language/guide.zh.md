---
kind: upgrade-guide
description: "CLI 和 SDK 的诊断消息现在遵循中文和日文语言偏好，不再始终使用英文。"
---

# CLI 与 SDK 诊断语言

[English](guide.md) | 中文

## 变更

CLI 帮助、启动报告和 SDK 自有的可读错误现在会在对应环境中选择中文或日文。`DSH_LANG`、`LC_ALL`、`LC_MESSAGES` 和 `LANG` 中首个非空值优先于操作系统区域设置。不支持的语言选择英文。TypeScript 与 Python SDK 操作可以显式选择 `en`、`zh` 或 `ja`，无需修改父进程环境。

命令名、参数、JSON 键、错误码、JSON-RPC 方法与数据以及外部诊断原文保持原值。比较完整英文错误消息或解析 CLI 可读输出的应用会受到影响。

## 迁移

1. 为依赖原有英文输出的脚本设置 `DSH_LANG=en`；优先使用稳定错误码和机器可读输出，避免解析文本。
2. 设置 TypeScript SDK 的 `language: 'ja'` 或 Python SDK 的 `language="ja"` 选项，为单个实例显式选择语言；中文使用 `zh`。Python 独立 Office 与运行时资源辅助 API 的操作选项也支持显式语言。
3. 运行 `DSH_LANG=ja dsh --help` 并确认帮助为日文，再使用 `DSH_LANG=zh` 确认中文，并使用 `DSH_LANG=en` 确认英文覆盖生效。单独检查 SDK 错误码，不要依赖已翻译的消息。
