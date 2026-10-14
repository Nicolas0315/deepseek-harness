"""Owned diagnostic templates and locale selection; external messages remain unchanged."""

from __future__ import annotations

import locale
import os
import re
from collections.abc import Mapping
from typing import Literal

Language = Literal["en", "ja"]


def resolve_language(env: Mapping[str, str] | None = None, language: Language | None = None) -> Language:
    """Select explicit language, then the first nonblank locale, then the system locale."""
    if language is not None:
        return language
    values = os.environ if env is None else env
    for name in ("DSH_LANG", "LC_ALL", "LC_MESSAGES", "LANG"):
        value = values.get(name, "").strip()
        if value:
            return "ja" if re.split(r"[-_.@]", value.lower())[0] in ("ja", "japanese") else "en"
    system = locale.getlocale()[0] or ""
    return "ja" if re.split(r"[-_.@]", system.lower())[0] in ("ja", "japanese") else "en"


def message(key: str, language: Language | None = None, **parameters: object) -> str:
    """Format one owned diagnostic without inspecting interpolated external text."""
    return CATALOGS[resolve_language(language=language)][key].format(**parameters)


CATALOGS: dict[Language, dict[str, str]] = {
    "en": {
        "metadata_missing": "deepseek-harness-runtime-bin is missing {path}",
        "exe_missing": "deepseek-harness-runtime-bin is missing the runtime executable at {path}. {hint}",
        "rg_missing": "deepseek-harness-runtime-bin is missing the ripgrep sidecar at {path}. {hint}",
        "helper_missing": "deepseek-harness-runtime-bin is missing the node-pty spawn helper at {path}. {hint}",
        "acquisition_hint": "Two ways to get the executable: run `scripts/build-exe-for-python-sdk.ts` (via tsx) in a deepseek-harness checkout, or install the matching `deepseek-harness-runtime-bin` platform wheel retained by the `build-exe-for-python-sdk` CI workflow. For local development against a repo source build, explicitly select the dev-only node carrier with DSH_RUNTIME_MODE=node (or resolve_bundled_launch_args('node')).",
        "mode_invalid": "unsupported DeepSeek Harness runtime mode {mode!r}: expected 'exe' or 'node' (explicit argument or $DSH_RUNTIME_MODE)",
        "platform_unsupported": "no bundled DeepSeek Harness SDK runtime exists for this platform (sys.platform={platform!r}, machine={machine!r}); supported: Linux x64/arm64, macOS x64/arm64, and Windows x64. {hint}",
        "node_missing": "the dev-only node runtime closure is missing at {root} (no {path}); run `scripts/build-exe-for-python-sdk.ts` in a deepseek-harness checkout, which builds and copies the deploy closure here. The node carrier is for repo-local development only — production uses the single-file exe.",
        "node_required": "the node runtime mode needs a system `node` (>=22.19) on PATH; install Node.js or use the exe mode",
        "download_failed": "resource download failed with exit code {code}",
        "resource_path_invalid": "runtime returned an invalid resource path",
        "home_required": "dsh: the Python runtime command requires an explicit DSH_HOME; it never uses ~/.dsh implicitly",
        "authoring_missing": "runtime authoring resources are missing: {path}",
        "authoring_target": "runtime authoring resources do not match target {target}",
        "python_version": "runtime authoring resources have invalid Python version metadata",
        "python_distributions": "runtime authoring resources have no Python distributions",
        "authoring_resource": "runtime authoring resource is missing: {path}",
        "python_packages": "runtime Python site-packages is missing: {path}",
        "executable_bit": "runtime interpreter lost its executable bit: {path}",
        "download_manifest": "invalid runtime download manifest: {path}",
        "office_skill": "runtime Office skill is missing: {path}",
        "cache_absolute": "DSH_RESOURCE_CACHE must be an absolute directory",
        "office_absolute": "DSH_OFFICE_SIDECAR must be an absolute directory",
        "office_incomplete": "Office download is incomplete: {path}. Call deepseek_harness_runtime.download_office() first.",
        "office_identity": "Office cache identity mismatch: {path}",
        "office_resource": "Office resource is missing: {path}. Call deepseek_harness_runtime.download_office() first.",
        "system_root": "Office operations on Windows require an absolute SystemRoot environment value."
    },
    "ja": {
        "metadata_missing": "deepseek-harness-runtime-bin に {path} がありません",
        "exe_missing": "deepseek-harness-runtime-bin にランタイム実行ファイル {path} がありません。{hint}",
        "rg_missing": "deepseek-harness-runtime-bin に ripgrep サイドカー {path} がありません。{hint}",
        "helper_missing": "deepseek-harness-runtime-bin に node-pty 起動ヘルパー {path} がありません。{hint}",
        "acquisition_hint": "実行ファイルは deepseek-harness チェックアウトで `scripts/build-exe-for-python-sdk.ts` を tsx 経由で実行するか、`build-exe-for-python-sdk` CI ワークフローに保存された対応プラットフォームの `deepseek-harness-runtime-bin` wheel をインストールして取得してください。リポジトリのソースビルドを使うローカル開発では、DSH_RUNTIME_MODE=node（または resolve_bundled_launch_args('node')）で開発専用 Node キャリアを明示的に選択してください。",
        "mode_invalid": "DeepSeek Harness ランタイムモード {mode!r} はサポートされていません。'exe' または 'node' を指定してください（明示的な引数または $DSH_RUNTIME_MODE）",
        "platform_unsupported": "このプラットフォーム用の DeepSeek Harness SDK ランタイムは同梱されていません（sys.platform={platform!r}, machine={machine!r}）。対応環境: Linux x64/arm64、macOS x64/arm64、Windows x64。{hint}",
        "node_missing": "開発専用 Node ランタイム一式が {root} にありません（{path} がありません）。deepseek-harness チェックアウトで `scripts/build-exe-for-python-sdk.ts` を実行してビルドし、ここに配置してください。Node キャリアはリポジトリ内のローカル開発専用です。本番環境では単一実行ファイルを使用します。",
        "node_required": "Node ランタイムモードには PATH 上のシステム `node`（22.19 以上）が必要です。Node.js をインストールするか exe モードを使用してください",
        "download_failed": "リソースのダウンロードが終了コード {code} で失敗しました",
        "resource_path_invalid": "ランタイムが無効なリソースパスを返しました",
        "home_required": "dsh: Python ランタイムコマンドには明示的な DSH_HOME が必要です。~/.dsh を暗黙に使用しません",
        "authoring_missing": "ランタイムの文書作成リソースがありません: {path}",
        "authoring_target": "ランタイムの文書作成リソースが対象 {target} と一致しません",
        "python_version": "ランタイムの文書作成リソースに無効な Python バージョン情報があります",
        "python_distributions": "ランタイムの文書作成リソースに Python 配布パッケージがありません",
        "authoring_resource": "ランタイムの文書作成リソースがありません: {path}",
        "python_packages": "ランタイムの Python site-packages がありません: {path}",
        "executable_bit": "ランタイムのインタープリターに実行権限がありません: {path}",
        "download_manifest": "ランタイムのダウンロードマニフェストが無効です: {path}",
        "office_skill": "ランタイムの Office スキルがありません: {path}",
        "cache_absolute": "DSH_RESOURCE_CACHE は絶対ディレクトリパスで指定してください",
        "office_absolute": "DSH_OFFICE_SIDECAR は絶対ディレクトリパスで指定してください",
        "office_incomplete": "Office のダウンロードが未完了です: {path}。先に deepseek_harness_runtime.download_office() を呼び出してください。",
        "office_identity": "Office キャッシュの識別情報が一致しません: {path}",
        "office_resource": "Office リソースがありません: {path}。先に deepseek_harness_runtime.download_office() を呼び出してください。",
        "system_root": "Windows での Office 操作には絶対パスの SystemRoot 環境変数が必要です。"
    }
}
