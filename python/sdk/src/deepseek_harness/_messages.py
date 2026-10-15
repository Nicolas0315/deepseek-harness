"""Owned diagnostic templates and locale selection; external messages remain unchanged."""

from __future__ import annotations

import locale
import os
import re
from collections.abc import Mapping
from typing import Literal

Language = Literal["en", "zh", "ja"]


def resolve_language(env: Mapping[str, str] | None = None, language: Language | None = None) -> Language:
    """Select explicit language, then the first nonblank locale, then the system locale."""
    if language is not None:
        return language
    values = os.environ if env is None else env
    for name in ("DSH_LANG", "LC_ALL", "LC_MESSAGES", "LANG"):
        value = values.get(name, "").strip()
        if value:
            primary = re.split(r"[-_.@]", value.lower())[0]
            return "zh" if primary in ("zh", "chinese") else "ja" if primary in ("ja", "japanese") else "en"
    system = locale.getlocale()[0] or ""
    primary = re.split(r"[-_.@]", system.lower())[0]
    return "zh" if primary in ("zh", "chinese") else "ja" if primary in ("ja", "japanese") else "en"


def message(key: str, language: Language | None = None, **parameters: object) -> str:
    """Format one owned diagnostic without inspecting interpolated external text."""
    return CATALOGS[resolve_language(language=language)][key].format(**parameters)


CATALOGS: dict[Language, dict[str, str]] = {
    "en": {
        "config_options": "pass either DeepSeekHarnessConfig or keyword options, not both",
        "finish_reason": "turn/end event requires a string data.reason.kind",
        "shutdown_failed": "shutdown request failed: {error}",
        "stdin_close_failed": "stdin close failed: {error}",
        "runtime_closed": "DeepSeek Harness runtime closed",
        "selected_profile": "selected dsh profile {profile!r}",
        "response_object": "{method} response must be a JSON object",
        "request_timeout": "{method} timed out waiting for DeepSeek Harness runtime{suffix}",
        "not_running": "DeepSeek Harness runtime is not running",
        "write_failed": "Failed to write to DeepSeek Harness runtime",
        "stdout_closed": "DeepSeek Harness runtime stdout closed",
        "rpc_error": "JSON-RPC error",
        "exit_code": "exit code: {code}",
        "stderr_tail": "stderr tail:\n",
        "runtime_missing": "Unable to locate the bundled DeepSeek Harness dsh runtime. Install deepseek-harness-runtime-bin.",
        "home_empty": "HarnessConfig requires a non-empty dsh_home",
        "home_required": "HarnessConfig requires an explicit dsh_home or non-empty DSH_HOME; the Python SDK never uses ~/.dsh implicitly",
        "office_empty": "Office CLI exited without a diagnostic.",
        "office_invalid": "Office CLI returned an invalid result."
    },
    "ja": {
        "config_options": "DeepSeekHarnessConfig とキーワードオプションはどちらか一方だけを渡してください",
        "finish_reason": "turn/end イベントには文字列の data.reason.kind が必要です",
        "shutdown_failed": "終了要求に失敗しました: {error}",
        "stdin_close_failed": "標準入力を閉じられませんでした: {error}",
        "runtime_closed": "DeepSeek Harness ランタイムが終了しました",
        "selected_profile": "選択した dsh プロファイル: {profile!r}",
        "response_object": "{method} の応答は JSON オブジェクトである必要があります",
        "request_timeout": "{method} は DeepSeek Harness ランタイムの応答待機中にタイムアウトしました{suffix}",
        "not_running": "DeepSeek Harness ランタイムは稼働していません",
        "write_failed": "DeepSeek Harness ランタイムへの書き込みに失敗しました",
        "stdout_closed": "DeepSeek Harness ランタイムの標準出力が閉じられました",
        "rpc_error": "JSON-RPC エラー",
        "exit_code": "終了コード: {code}",
        "stderr_tail": "標準エラー出力の末尾:\n",
        "runtime_missing": "同梱の DeepSeek Harness dsh ランタイムが見つかりません。deepseek-harness-runtime-bin をインストールしてください。",
        "home_empty": "HarnessConfig には空でない dsh_home が必要です",
        "home_required": "HarnessConfig には明示的な dsh_home または空でない DSH_HOME が必要です。Python SDK は ~/.dsh を暗黙に使用しません",
        "office_empty": "Office CLI が診断メッセージを出さずに終了しました。",
        "office_invalid": "Office CLI が無効な結果を返しました。"
    },
    "zh": {
        "config_options": "请传入 DeepSeekHarnessConfig 或关键字选项之一，不能同时传入",
        "finish_reason": "turn/end 事件需要字符串 data.reason.kind",
        "shutdown_failed": "关闭请求失败：{error}",
        "stdin_close_failed": "关闭标准输入失败：{error}",
        "runtime_closed": "DeepSeek Harness 运行时已关闭",
        "selected_profile": "已选择 dsh 配置文件 {profile!r}",
        "response_object": "{method} 响应必须是 JSON 对象",
        "request_timeout": "等待 DeepSeek Harness 运行时的 {method} 超时{suffix}",
        "not_running": "DeepSeek Harness 运行时未运行",
        "write_failed": "写入 DeepSeek Harness 运行时失败",
        "stdout_closed": "DeepSeek Harness 运行时标准输出已关闭",
        "rpc_error": "JSON-RPC 错误",
        "exit_code": "退出代码：{code}",
        "stderr_tail": "标准错误末尾：\n",
        "runtime_missing": "无法找到随附的 DeepSeek Harness dsh 运行时。请安装 deepseek-harness-runtime-bin。",
        "home_empty": "HarnessConfig 需要非空 dsh_home",
        "home_required": "HarnessConfig 需要显式 dsh_home 或非空 DSH_HOME；Python SDK 不会隐式使用 ~/.dsh",
        "office_empty": "Office CLI 退出时未提供诊断。",
        "office_invalid": "Office CLI 返回了无效结果。"
    }
}
