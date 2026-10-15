"""Standalone Office and runtime language options preserve process results."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import deepseek_harness_runtime as runtime
import pytest
from deepseek_harness import office
from deepseek_harness.errors import SdkProtocolError
from deepseek_harness_runtime import _resources


@pytest.mark.parametrize("failure,expected", [("empty", "診断メッセージを出さず"), ("invalid", "無効な結果")])
def test_office_explicit_language_reaches_local_diagnostics(failure: str, expected: str, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    seen = []
    monkeypatch.setattr(runtime, "resolve_office_launch_args", lambda **options: seen.append(options) or ("node", "office.js"))
    result = subprocess.CompletedProcess([], 1 if failure == "empty" else 0, b"", b"")
    monkeypatch.setattr(office, "run_office_process", lambda arguments, **options: seen.append((arguments, options)) or result)
    options = office.OfficeOptions(language="ja", env={"OFFICE_TEST": "日本語"}, timeout_ms=123)
    with pytest.raises(office.OfficeError if failure == "empty" else SdkProtocolError, match=expected):
        office.convert("日本語.docx", "日本語.pdf", options=options)
    assert seen[0]["language"] == seen[1][1]["language"] == "ja"
    assert seen[0]["env"]["DSH_LANG"] == seen[1][1]["env"]["DSH_LANG"] == "ja"
    assert seen[0]["env"]["OFFICE_TEST"] == "日本語"
    assert seen[1][0] == ["node", "office.js", "convert", "--input", "日本語.docx", "--output", "日本語.pdf", "--timeout-ms", "123"]
    assert options._arguments() == ["--timeout-ms", "123"]
    assert os.environ["DSH_LANG"] == "en"
    assert "OFFICE_TEST" not in os.environ


@pytest.mark.parametrize("download", ["download_office", "download_primary_runtime"])
def test_download_explicit_language_reaches_child_and_empty_failure(download: str, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    script = tmp_path / "資源.py"
    receipt = tmp_path / "receipt.json"
    script.write_text('import json, os, sys\nfrom pathlib import Path\nPath(os.environ["RECEIPT"]).write_text(json.dumps({"argv":sys.argv[1:],"language":os.environ["DSH_LANG"],"cache":os.environ["DSH_RESOURCE_CACHE"],"resource":os.environ["DSH_RUNTIME_DOWNLOAD"]}))\nsys.exit(37)\n', encoding="utf-8")
    monkeypatch.setattr(runtime, "resolve_bundled_launch_args", lambda **options: (sys.executable, str(script)))
    with pytest.raises(RuntimeError, match="ダウンロードが終了コード 37"):
        getattr(runtime, download)(language="ja", env={"RECEIPT": str(receipt), "DSH_RESOURCE_CACHE": str(tmp_path / "日本語キャッシュ")})
    assert json.loads(receipt.read_text()) == {"argv": [], "language": "ja", "cache": str(tmp_path / "日本語キャッシュ"), "resource": "office" if download == "download_office" else "primary"}
    assert os.environ["DSH_LANG"] == "en"


def test_office_lookup_uses_explicit_env_and_localizes_asset_validation(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    monkeypatch.setattr(runtime, "_current_platform_tag", lambda **options: "linux-x64")
    monkeypatch.setattr(runtime, "bundled_runtime_path", lambda **options: tmp_path / "runtime")
    (tmp_path / "linux-x64").mkdir()
    manifest = tmp_path / "linux-x64/downloads.json"
    manifest.write_text("{}")
    with pytest.raises(ValueError, match="ダウンロードマニフェストが無効"):
        runtime.resolve_office_launch_args(language="ja", env={"DSH_RESOURCE_CACHE": str(tmp_path)})
    monkeypatch.setattr(_resources, "validate_downloads", lambda *args, **options: {"identity": "fixture"})
    with pytest.raises(ValueError, match="絶対ディレクトリパス"):
        runtime.resolve_office_launch_args(language="ja", env={"DSH_RESOURCE_CACHE": "relative"})
    sidecar = tmp_path / "日本語office"
    node = sidecar / "node/bin/node"
    cli = sidecar / "node_modules/@deepseek-ai/libreoffice-kit/lib/cli.js"
    for path in (node, cli):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch()
    monkeypatch.setenv("DSH_OFFICE_SIDECAR", "ambient-invalid")
    assert runtime.resolve_office_launch_args(language="ja", env={"DSH_OFFICE_SIDECAR": str(sidecar), "DSH_RESOURCE_CACHE": str(tmp_path)}) == (str(node), str(cli))
    assert os.environ["DSH_OFFICE_SIDECAR"] == "ambient-invalid"


def test_download_primary_validates_assets_with_selected_language(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    monkeypatch.setattr(runtime, "_download", lambda *args, **options: tmp_path / "primary-runtime")
    with pytest.raises(FileNotFoundError, match="文書作成リソースがありません"):
        runtime.download_primary_runtime(language="ja", env={"DSH_LANG": "en"})


def test_office_process_environment_and_raw_results_are_preserved(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    script = tmp_path / "日本語.py"
    script.write_text('import os, sys\nsys.stdout.buffer.write((os.environ["DSH_LANG"] + ":日本語").encode())\nsys.stderr.buffer.write(b"raw provider stderr")\nsys.exit(37)\n', encoding="utf-8")
    result = _resources.run_office_process([sys.executable, str(script)], language="ja", env={"DSH_LANG": "en"})
    assert result.stdout == "ja:日本語".encode()
    assert result.stderr == b"raw provider stderr"
    assert result.returncode == 37
    assert os.environ["DSH_LANG"] == "en"
