---
description: "CLI 与 SDK 诊断词典的语言选择。"
kind: "package-library"
---

# dsh-diagnostic-locale

[English](README.md) | 中文

## 概述

这个无状态库为 CLI 与 SDK 诊断选择英语或日语。各调用方拥有自己的文案，捕获有效环境和操作系统语言，然后调用 `resolveDiagnosticLocale(environment, systemLocale)`。该库不读取进程状态，也不修改环境变量。

## 目录

- [API](#api)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="api"></a>
## API

`DiagnosticLocale` 为 `en | ja`。`resolveDiagnosticLocale` 依次从 `DSH_LANG`、`LC_ALL`、`LC_MESSAGES` 和 `LANG` 中选择第一个非空值，均为空时使用调用方传入的系统语言。主语言为 `ja` 时选择日语，包括 `ja-JP` 和 `ja_JP.UTF-8`；Windows 旧式名称 `Japanese_Japan` 也选择日语。其他值（含 `C` 与 `POSIX`）选择英语，因此 `DSH_LANG=en` 可在日语系统上保留英语诊断。

语言选择仅影响人类可读的说明。调用方保留命令名、路径、协议字段、错误码和外部诊断原文。GUI 偏好仍由 [client locale](../../client/locale/README.zh.md) 管理。

<a id="model-experience"></a>
## 模型体验

无，因为该库只选择诊断语言，不注册模型可见消息或会话事件。

#### KV Cache 影响

无；该库不向模型发送文本。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **词典由调用方拥有** — 该库不翻译模型提供方、操作系统或包管理器的错误。
- **仅英语与日语** — 其他诊断语言回退到英语；GUI 语言包使用独立注册表。

<a id="dev-note"></a>
### 开发备注

无。
