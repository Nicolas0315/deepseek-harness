---
kind: upgrade-guide
description: "带类型的客户端字典注册需要在英文和中文之外提供日文字典。"
---

# 日文客户端字典

[English](guide.md) | 中文

## 变更

`BuiltInLocaleId` 包含 `ja`。使用 `ctx.locale.register(ns, { zh, en })` 的客户端插件必须提供完整的日文字典。日文已经作为可选择的内置语言注册，语言包不能再次注册其定义。偏好日文的浏览器和原生壳会自动选择日文，除非已保存的偏好覆盖此选择。

## 迁移

1. 添加 `ja` 字典，包含该命名空间已有的键和插值参数，然后调用 `ctx.locale.register(ns, { zh, en, ja })`。
2. 从日文语言包中移除 `ctx.locale.addLanguage({ id: 'ja', ... })`。语言包仍可使用逐语言注册形式，为其拥有的命名空间提供日文字典。
3. 重新构建客户端插件，在“设置 → 常规”中选择 日本語，并确认内容已翻译。在日文系统上显式选择 English 或 中文，即可保留相应语言。
