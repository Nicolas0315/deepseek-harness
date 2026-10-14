"""SDK language selection and diagnostics preserve transport data."""

from __future__ import annotations

import importlib
import json
import os
import string
import sys
from pathlib import Path

import pytest

from deepseek_harness import DeepSeekHarness, DeepSeekHarnessConfig, HarnessClient, HarnessConfig
from deepseek_harness.errors import JsonRpcError, TransportClosedError


@pytest.mark.parametrize("module", ["deepseek_harness._messages", "deepseek_harness_runtime._messages"])
def test_catalogs_have_identical_keys_and_parameters(module: str) -> None:
    messages = importlib.import_module(module)
    assert messages.CATALOGS["en"].keys() == messages.CATALOGS["ja"].keys()
    for key, english in messages.CATALOGS["en"].items():
        japanese = messages.CATALOGS["ja"][key]
        parameters = lambda text: {field for _, field, _, _ in string.Formatter().parse(text) if field is not None}
        assert parameters(english) == parameters(japanese), key
        assert japanese != english, key
        assert messages.message(key, "ja", **{field: "日本語値" for field in parameters(english)})


@pytest.mark.parametrize("module", ["deepseek_harness._messages", "deepseek_harness_runtime._messages"])
@pytest.mark.parametrize("env,expected", [
    ({"DSH_LANG": "en", "LANG": "ja_JP.UTF-8"}, "en"),
    ({"DSH_LANG": "  ", "LC_ALL": "ja-JP", "LANG": "en_US"}, "ja"),
    ({"LC_MESSAGES": "ja_JP.UTF8", "LANG": "en_US"}, "ja"),
    ({"LC_ALL": "fr_FR", "LANG": "ja"}, "en"),
    ({"DSH_LANG": "jargon", "LANG": "ja"}, "en"),
])
def test_locale_precedence(module: str, env: dict[str, str], expected: str) -> None:
    messages = importlib.import_module(module)
    assert messages.resolve_language(env) == expected
    assert messages.resolve_language(env, "ja") == "ja"
    assert messages.resolve_language(env, "en") == "en"


def test_instance_language_and_child_environment_are_isolated(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DSH_LANG", "en")
    script = tmp_path / "日本語ランタイム.py"
    script.write_text('''import json, os, sys
for line in sys.stdin:
    request = json.loads(line)
    print(json.dumps({"id": request["id"], "result": {"language": os.environ["DSH_LANG"], "payload": request.get("params")}}, ensure_ascii=False), flush=True)
''', encoding="utf-8")
    from pydantic import BaseModel
    class Response(BaseModel):
        language: str
        payload: dict
    for language in ("ja", "en"):
        client = HarnessClient(HarnessConfig(language=language), _launch_args=(sys.executable, str(script)))
        with pytest.raises(TransportClosedError, match="稼働していません" if language == "ja" else "is not running"):
            client.notify("日本語method", {"名前": "本文"})
        client.start()
        try:
            response = client.request("日本語method", {"名前": "本文"}, response_model=Response)
            assert response.language == language
            assert response.payload == {"名前": "本文"}
        finally:
            client.close()
    assert os.environ["DSH_LANG"] == "en"


def test_environment_language_reaches_high_level_and_preserves_rpc_error() -> None:
    harness = DeepSeekHarness(DeepSeekHarnessConfig(env={"DSH_LANG": "ja"}))
    assert harness.client.language == "ja"
    client = harness.client
    import queue
    waiter = queue.Queue()
    client._responses["1"] = waiter
    raw = "provider failed: 日本語 raw"
    data = {"reason": "raw reason", "status": "error"}
    client._handle_message({"id": "1", "error": {"code": -123, "message": raw, "data": data}})
    error = waiter.get_nowait()
    assert isinstance(error, JsonRpcError)
    assert (error.code, error.message, error.data) == (-123, raw, data)


def test_runtime_locale_is_explicit_without_global_mutation(monkeypatch) -> None:
    import deepseek_harness_runtime as runtime
    monkeypatch.setenv("DSH_LANG", "en")
    with pytest.raises(ValueError, match="サポートされていません"):
        runtime.resolve_bundled_launch_args("bogus", language="ja", env={"DSH_LANG": "en"})
    assert os.environ["DSH_LANG"] == "en"


@pytest.mark.parametrize("module", ["deepseek_harness._messages", "deepseek_harness_runtime._messages"])
@pytest.mark.parametrize("system_language", ["ja_JP", "Japanese_Japan"])
def test_blank_environment_falls_back_to_system_locale(module: str, system_language: str, monkeypatch) -> None:
    messages = importlib.import_module(module)
    monkeypatch.setattr(messages.locale, "getlocale", lambda: (system_language, "UTF-8"))
    assert messages.resolve_language({"DSH_LANG": " ", "LC_ALL": ""}) == "ja"
    assert messages.resolve_language({"DSH_LANG": "fr"}) == "en"
    monkeypatch.setattr(messages.locale, "getlocale", lambda: (None, None))
    assert messages.resolve_language({}) == "en"


def test_japanese_protocol_and_diagnostics_preserve_external_text() -> None:
    from deepseek_harness.api import finish_reason
    from deepseek_harness.errors import SdkProtocolError
    client = HarnessClient(HarnessConfig(language="ja"))
    raw = "provider stderr: raw 日本語 /資料/日本語.txt"
    client._stderr_lines.append(raw)
    assert client._runtime_diagnostics() == "標準エラー出力の末尾:\n" + raw
    with pytest.raises(SdkProtocolError, match="文字列の data.reason.kind"):
        finish_reason([{"type": "turn/end", "data": {"reason": {}}}], language=client.language)
    assert finish_reason([{"type": "turn/end", "data": {"reason": {"kind": "error"}}}], language=client.language) == "error"


def test_japanese_timeout_retains_method_profile_and_process_stderr(tmp_path: Path) -> None:
    script = tmp_path / "応答しない.py"
    script.write_text('import sys, time\nprint("raw provider failure 日本語", file=sys.stderr, flush=True)\nfor line in sys.stdin: time.sleep(1)\n', encoding="utf-8")
    client = HarnessClient(HarnessConfig(language="ja", profile="日本語profile", initialize_timeout_seconds=0.1,
                                         shutdown_timeout_seconds=0.01), _launch_args=(sys.executable, str(script)))
    client.start()
    with pytest.raises(TimeoutError) as error:
        client.initialize(cwd=str(tmp_path), provider="raw-provider", model="raw-model")
    assert "initialize は DeepSeek Harness ランタイムの応答待機中にタイムアウトしました" in str(error.value)
    assert "選択した dsh プロファイル: '日本語profile'" in str(error.value)
    assert "raw provider failure 日本語" in str(error.value)


def test_runtime_wheel_locale_has_no_sdk_dependency(tmp_path: Path) -> None:
    import subprocess
    runtime_src = Path(__file__).resolve().parents[2] / "sdk-runtime/src"
    result = subprocess.run([sys.executable, "-S", "-c", '''import deepseek_harness_runtime as runtime
try:
    runtime.resolve_bundled_launch_args("invalid", language="ja")
except ValueError as error:
    print(error)
'''], env={**os.environ, "PYTHONPATH": str(runtime_src)}, capture_output=True, encoding="utf-8", check=True)
    assert "サポートされていません" in result.stdout


def test_runtime_explicit_locale_reaches_missing_executable(tmp_path: Path, monkeypatch) -> None:
    import deepseek_harness_runtime as runtime
    monkeypatch.setattr(runtime, "bundled_package_dir", lambda **kwargs: tmp_path)
    monkeypatch.setattr(runtime, "_current_platform_tag", lambda **kwargs: "linux-x64")
    with pytest.raises(FileNotFoundError) as error:
        runtime.resolve_bundled_launch_args(language="ja", env={"DSH_LANG": "en"})
    assert "ランタイム実行ファイル" in str(error.value)
    assert "インストールして取得してください" in str(error.value)


def test_japanese_office_diagnostics_preserve_external_errors(monkeypatch) -> None:
    import subprocess
    from deepseek_harness import office
    from deepseek_harness.errors import SdkProtocolError
    monkeypatch.setenv("DSH_LANG", "ja")
    monkeypatch.setattr(office.deepseek_harness_runtime, "resolve_office_launch_args", lambda **_kwargs: ("node", "office.js"))
    result = subprocess.CompletedProcess([], 1, b"", b"")
    monkeypatch.setattr(office, "run_office_process", lambda arguments, **_kwargs: result)
    with pytest.raises(office.OfficeError, match="診断メッセージを出さず") as error:
        office.convert("日本語.docx", "日本語.pdf")
    assert (error.value.code, error.value.exit_code) == ("failed", 1)
    raw = "raw external diagnostic 日本語"
    result.stderr = json.dumps({"code": "raw-code", "error": raw}).encode()
    with pytest.raises(office.OfficeError) as error:
        office.convert("日本語.docx", "日本語.pdf")
    assert str(error.value) == raw
    assert error.value.code == "raw-code"
    result.returncode = 0
    with pytest.raises(SdkProtocolError, match="無効な結果"):
        office.convert("日本語.docx", "日本語.pdf")
