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
            if primary in ("zh", "chinese"):
                return "zh"
            return "ja" if primary in ("ja", "japanese") else "en"
    system = locale.getlocale()[0] or ""
    primary = re.split(r"[-_.@]", system.lower())[0]
    if primary in ("zh", "chinese"):
        return "zh"
    return "ja" if primary in ("ja", "japanese") else "en"


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
    "zh": {
        "metadata_missing": "deepseek-harness-runtime-bin 缺少 {path}",
        "exe_missing": "deepseek-harness-runtime-bin 在 {path} 缺少运行时可执行文件。{hint}",
        "rg_missing": "deepseek-harness-runtime-bin 在 {path} 缺少 ripgrep 辅助程序。{hint}",
        "helper_missing": "deepseek-harness-runtime-bin 在 {path} 缺少 node-pty 启动辅助程序。{hint}",
        "acquisition_hint": "获取可执行文件有两种方式：在 deepseek-harness 检出目录中通过 tsx 运行 `scripts/build-exe-for-python-sdk.ts`，或安装由 `build-exe-for-python-sdk` CI 工作流保留的匹配平台 `deepseek-harness-runtime-bin` wheel。针对仓库源码构建的本地开发，请用 DSH_RUNTIME_MODE=node（或 resolve_bundled_launch_args('node')）明确选择仅供开发的 Node 载体。",
        "mode_invalid": "不支持的 DeepSeek Harness 运行时模式 {mode!r}：应为 'exe' 或 'node'（显式参数或 $DSH_RUNTIME_MODE）",
        "platform_unsupported": "此平台没有随附的 DeepSeek Harness SDK 运行时（sys.platform={platform!r}, machine={machine!r}）；支持：Linux x64/arm64、macOS x64/arm64 和 Windows x64。{hint}",
        "node_missing": "仅供开发的 Node 运行时闭包在 {root} 缺失（没有 {path}）；请在 deepseek-harness 检出目录中运行 `scripts/build-exe-for-python-sdk.ts`，它会构建并将部署闭包复制到这里。Node 载体仅用于仓库内本地开发；生产环境使用单文件 exe。",
        "node_required": "Node 运行时模式需要 PATH 中的系统 `node`（>=22.19）；请安装 Node.js 或使用 exe 模式",
        "download_failed": "资源下载失败，退出代码为 {code}",
        "resource_path_invalid": "运行时返回了无效的资源路径",
        "home_required": "dsh：Python 运行时命令需要显式 DSH_HOME；绝不隐式使用 ~/.dsh",
        "authoring_missing": "缺少运行时创作资源：{path}",
        "authoring_target": "运行时创作资源与目标 {target} 不匹配",
        "python_version": "运行时创作资源的 Python 版本元数据无效",
        "python_distributions": "运行时创作资源没有 Python 发行版",
        "authoring_resource": "缺少运行时创作资源：{path}",
        "python_packages": "缺少运行时 Python site-packages：{path}",
        "executable_bit": "运行时解释器失去了可执行位：{path}",
        "download_manifest": "运行时下载清单无效：{path}",
        "office_skill": "缺少运行时 Office 技能：{path}",
        "cache_absolute": "DSH_RESOURCE_CACHE 必须是绝对目录",
        "office_absolute": "DSH_OFFICE_SIDECAR 必须是绝对目录",
        "office_incomplete": "Office 下载未完成：{path}。请先调用 deepseek_harness_runtime.download_office()。",
        "office_identity": "Office 缓存标识不匹配：{path}",
        "office_resource": "缺少 Office 资源：{path}。请先调用 deepseek_harness_runtime.download_office()。",
        "system_root": "Windows 上的 Office 操作需要绝对路径的 SystemRoot 环境变量。"
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
