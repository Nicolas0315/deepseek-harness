"""Validate wheel download manifests, downloaded resources, and Office process launches."""

from __future__ import annotations

import json
import os
import signal
import subprocess
from collections.abc import Mapping, Sequence
import re
import stat
import zipfile
from pathlib import Path

from ._messages import Language, message, resolve_language


def validate_resources(
    root: Path | zipfile.Path, target: str, *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> None:
    """Reject a missing or wrong-target Python/Node environment or bundled Office skill tree."""
    language = resolve_language({**os.environ, **(env or {})}, language)
    manifest_path = root / "primary-runtime/runtime.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(message("authoring_missing", language, path=manifest_path))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    platform, arch = target.rsplit("-", 1)
    platform = {"macos": "darwin", "win": "win32"}.get(platform, platform)
    if not isinstance(manifest, dict) or (manifest.get("platform"), manifest.get("arch")) != (platform, arch):
        raise ValueError(message("authoring_target", language, target=target))
    version = manifest.get("python")
    if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError(message("python_version", language))
    if not isinstance(manifest.get("pythonPackages"), dict) or not manifest["pythonPackages"]:
        raise ValueError(message("python_distributions", language))
    python_root = root / "primary-runtime/dependencies/python"
    executable = python_root / ("python.exe" if platform == "win32" else "bin/python3")
    packages = python_root / ("Lib/site-packages" if platform == "win32" else f"lib/python{version.rsplit('.', 1)[0]}/site-packages")
    node = root / "primary-runtime/dependencies/node/bin" / ("node.exe" if platform == "win32" else "node")
    required = [executable, node]
    required.extend(root / f"office-skills/office-{kind}/SKILL.md" for kind in ("docx", "pptx", "xlsx"))
    for path in required:
        if not path.is_file():
            raise FileNotFoundError(message("authoring_resource", language, path=path))
    if not packages.is_dir():
        raise FileNotFoundError(message("python_packages", language, path=packages))
    if platform != "win32":
        for binary in (executable, node):
            mode = (binary.root.getinfo(binary.at).external_attr >> 16
                    if isinstance(binary, zipfile.Path) else binary.stat().st_mode)
            if mode & stat.S_IXUSR == 0:
                raise ValueError(message("executable_bit", language, path=binary))


def validate_downloads(
    root: Path | zipfile.Path, target: str, *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> dict:
    """Validate the lightweight download manifest carried by one platform wheel."""
    language = resolve_language({**os.environ, **(env or {})}, language)
    path = root / "downloads.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    if (not isinstance(value, dict) or value.get("target") != target.replace("macos-", "mac-")
            or not isinstance(value.get("identity"), str)
            or not re.fullmatch(r"[a-f0-9]{64}", value["identity"])
            or not isinstance(value.get("office"), list) or not value["office"]
            or not isinstance(value.get("pnpm"), dict)):
        raise ValueError(message("download_manifest", language, path=path))
    for file in (f"office-{kind}/SKILL.md" for kind in ("docx", "pptx", "xlsx")):
        if not (root / "office-skills" / file).is_file():
            raise FileNotFoundError(message("office_skill", language, path=root / "office-skills" / file))
    return value


def office_launch_args(
    root: Path, target: str, *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> tuple[str, str]:
    """Require an explicitly installed sidecar, including its independent Node interpreter."""
    effective_env = {**os.environ, **(env or {})}
    language = resolve_language(effective_env, language)
    metadata = validate_downloads(root, target, language=language, env=effective_env)
    cache = Path(effective_env.get("DSH_RESOURCE_CACHE", str(Path.home() / ".cache/deepseek-harness/resources")))
    if not cache.is_absolute():
        raise ValueError(message("cache_absolute", language))
    office = Path(effective_env.get("DSH_OFFICE_SIDECAR", str(cache / metadata["identity"] / "office")))
    if not office.is_absolute():
        raise ValueError(message("office_absolute", language))
    if "DSH_OFFICE_SIDECAR" not in effective_env:
        complete = office / "complete"
        if not complete.is_file():
            raise FileNotFoundError(message("office_incomplete", language, path=office))
        if complete.read_text(encoding="utf-8") != metadata["identity"]:
            raise ValueError(message("office_identity", language, path=office))
    node = office / "node/bin" / ("node.exe" if target == "win-x64" else "node")
    cli = office / "node_modules/@deepseek-ai/libreoffice-kit/lib/cli.js"
    for path in (node, cli):
        if not path.is_file():
            raise FileNotFoundError(message("office_resource", language, path=path))
    return str(node), str(cli)


def run_office_process(
    arguments: Sequence[str], *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> subprocess.CompletedProcess[bytes]:
    """Run Office with captured streams; a second interrupt kills its process tree."""
    effective_env = {**os.environ, **(env or {})}
    language = resolve_language(effective_env, language)
    effective_env["DSH_LANG"] = language
    taskkill = os.path.join(effective_env.get("SystemRoot", ""), "System32", "taskkill.exe")
    if os.name == "nt" and not os.path.isabs(taskkill):
        raise ValueError(message("system_root", language))
    with subprocess.Popen(
        arguments,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=os.name != "nt",
        env=effective_env,
    ) as process:
        try:
            stdout, stderr = process.communicate()
        except KeyboardInterrupt:
            # Windows console Ctrl+C already reaches children in the same console.
            if os.name != "nt":
                process.send_signal(signal.SIGINT)
            try:
                process.communicate()
            except KeyboardInterrupt:
                if os.name == "nt":
                    subprocess.run([taskkill, "/PID", str(process.pid), "/T", "/F"],
                                   stdin=subprocess.DEVNULL, capture_output=True, check=False, env=effective_env)
                else:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError as error:
                        # The CLI and its children can finish before the second interrupt.
                        pass
                process.communicate()
            raise
    return subprocess.CompletedProcess(arguments, process.returncode, stdout, stderr)
