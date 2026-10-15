"""Locate and execute the bundled dsh CLI shipped with the Python SDK runtime.

Two runtime carriers coexist under ``runtime/``, both injected by the repo's
``scripts/build-exe-for-python-sdk.ts`` build (neither is checked into git):

- **exe (production)**: single-file Node executables named
  ``deepseek-harness-sdk-runtime-<platform>-<arch>`` for Linux/macOS and an
  ``.exe`` counterpart for Windows. Each has a sibling ripgrep executable;
  macOS also uses a sibling ``-spawn-helper``. The target machine needs no
  Node installation.
- **node (dev-only)**: the full deploy closure under ``runtime/node/``
  (``package.json`` + ``node_modules/``), executed as ``node
  runtime/node/runtime-bootstrap.mjs`` on a
  system Node >= 22.19. It is the current checkout's source build, never
  selected automatically, and excluded from wheel/sdist distributions.

Both carriers execute the same dsh command grammar. The Python SDK selects the
``sdk`` profile and requires an explicit Harness home; the installed ``dsh``
console command requires ``DSH_HOME`` for the same reason.
"""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import sys
from collections.abc import Mapping
from pathlib import Path

from ._messages import Language, message, resolve_language
from ._resources import validate_downloads, validate_resources, office_launch_args

PACKAGE_METADATA_FILENAME = "deepseek-harness-runtime.json"

RUNTIME_MODE_ENV_VAR = "DSH_RUNTIME_MODE"

_PLATFORM_TAGS = {"linux": "linux", "darwin": "macos", "win32": "win"}
_ARCH_TAGS = {"x86_64": "x64", "amd64": "x64", "arm64": "arm64", "aarch64": "arm64"}


def bundled_package_dir(*, language: Language | None = None) -> Path:
    """Root directory of the installed runtime package data (the directory of this module)."""
    root = Path(__file__).resolve().parent
    metadata = root / PACKAGE_METADATA_FILENAME
    if not metadata.is_file():
        raise FileNotFoundError(message("metadata_missing", language, path=metadata))
    return root


def bundled_runtime_path(*, language: Language | None = None) -> Path:
    """Absolute path of the bundled single-file runtime executable for the current platform.

    Raises FileNotFoundError when the platform is unsupported, the executable
    has not been placed into this package, the ripgrep sidecar or download
    manifest is missing, or the required macOS spawn helper is missing.
    Invalid download metadata raises ValueError. Missing executable messages name
    the acquisition routes (acquisition strategy is deliberately separate from
    this lookup interface, so an on-demand download can replace it without
    touching callers).
    """
    tag = _current_platform_tag(language=language)
    extension = ".exe" if tag.startswith("win-") else ""
    path = bundled_package_dir(language=language) / "runtime" / f"deepseek-harness-sdk-runtime-{tag}{extension}"
    if not path.is_file():
        raise FileNotFoundError(
            message("exe_missing", language, path=path, hint=message("acquisition_hint", language))
        )
    ripgrep = (
        path.with_name(f"{path.stem}-rg.exe")
        if tag.startswith("win-")
        else Path(f"{path}-rg")
    )
    if not ripgrep.is_file():
        raise FileNotFoundError(
            message("rg_missing", language, path=ripgrep, hint=message("acquisition_hint", language))
        )
    if tag.startswith("macos-"):
        helper = Path(f"{path}-spawn-helper")
        if not helper.is_file():
            raise FileNotFoundError(
                message("helper_missing", language, path=helper, hint=message("acquisition_hint", language))
            )
    validate_downloads(path.with_name(tag), tag, language=language)
    return path


def resolve_bundled_launch_args(
    mode: str | None = None, *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> tuple[str, ...]:
    """The argv tuple that launches the bundled runtime.

    Mode selection: the explicit ``mode`` argument wins, then the
    ``DSH_RUNTIME_MODE`` environment variable (``exe`` | ``node``), then
    automatic resolution. Automatic resolution finds the production exe ONLY —
    the dev-only node carrier must be selected explicitly so a production
    deployment can never silently ride on a source build. Returns
    ``(exe_path,)`` in exe mode and ``(node_path, bin_js_path)`` in node mode;
    raises FileNotFoundError when the selected carrier is unavailable and
    ValueError for an unknown mode value. ``env`` supplies runtime-mode and locale
    selection; explicit ``language`` wins. Neither changes the process environment.
    """
    if env is not None:
        language = resolve_language(env, language)
    selected = mode if mode is not None else (os.environ if env is None else env).get(RUNTIME_MODE_ENV_VAR)
    if selected is None or selected == "exe":
        return (str(bundled_runtime_path(language=language)),)
    if selected == "node":
        return _node_launch_args(language=language)
    raise ValueError(
        message("mode_invalid", language, mode=selected)
    )


def _current_platform_tag(*, language: Language | None = None) -> str:
    plat = _PLATFORM_TAGS.get(sys.platform)
    arch = _ARCH_TAGS.get(platform.machine().lower())
    if (
        plat is None
        or arch is None
        or (plat == "win" and arch != "x64")
    ):
        raise FileNotFoundError(
            message("platform_unsupported", language, platform=sys.platform, machine=platform.machine(),
                    hint=message("acquisition_hint", language))
        )
    return f"{plat}-{arch}"


def _node_launch_args(*, language: Language | None = None) -> tuple[str, str]:
    node_root = bundled_package_dir(language=language) / "runtime" / "node"
    bin_js = node_root / "runtime-bootstrap.mjs"
    if not bin_js.is_file():
        raise FileNotFoundError(
            message("node_missing", language, root=node_root, path=bin_js)
        )
    node = shutil.which("node")
    if node is None:
        raise FileNotFoundError(
            message("node_required", language)
        )
    return (node, str(bin_js))


def _download(
    resource: str, *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> Path:
    effective_env = {**os.environ, **(env or {})}
    language = resolve_language(effective_env, language)
    effective_env["DSH_LANG"] = language
    effective_env["DSH_RUNTIME_DOWNLOAD"] = resource
    result = subprocess.run(resolve_bundled_launch_args(language=language, env=effective_env),
                            capture_output=True, encoding="utf-8", env=effective_env)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or message("download_failed", language, code=result.returncode))
    path = json.loads(result.stdout)
    if not isinstance(path, str) or not Path(path).is_absolute():
        raise ValueError(message("resource_path_invalid", language))
    return Path(path)


def download_office(*, language: Language | None = None, env: Mapping[str, str] | None = None) -> Path:
    """Download the locked npm Office sidecar and standalone Node into the resource cache.

    Return its absolute directory. Reuse completed downloads; failures leave no
    published partial installation. DSH_RESOURCE_CACHE selects the cache root.
    This explicit operation requires network access on a cache miss, not a
    Harness home, agent, or model. Other SDK operations never trigger downloads.
    language selects diagnostics and child DSH_LANG; env overrides inherited variables.
    """
    return _download("office", language=language, env=env)


def download_primary_runtime(*, language: Language | None = None, env: Mapping[str, str] | None = None) -> Path:
    """Download locked CPython, libraries, Node, pnpm and skills into the resource cache.

    Return the absolute primary-runtime directory. This is independent of the
    Office engine download and does not copy resources into a Harness home.
    Completed downloads are reused; DSH_RESOURCE_CACHE selects the cache root.
    language selects diagnostics and child DSH_LANG; env overrides inherited variables.
    """
    effective_env = {**os.environ, **(env or {})}
    language = resolve_language(effective_env, language)
    path = _download("primary", language=language, env=effective_env)
    validate_resources(path.parent, _current_platform_tag(language=language), language=language, env=effective_env)
    return path


def resolve_office_launch_args(
    *, language: Language | None = None, env: Mapping[str, str] | None = None,
) -> tuple[str, str]:
    """Locate the explicitly downloaded Office CLI and its standalone Node; never download.

    language selects diagnostics; env overrides inherited variables for resource lookup.
    """
    effective_env = {**os.environ, **(env or {})}
    language = resolve_language(effective_env, language)
    tag = _current_platform_tag(language=language)
    return office_launch_args(bundled_runtime_path(language=language).with_name(tag), tag,
                              language=language, env=effective_env)


def main() -> None:
    """Launch the CLI with explicit DSH_HOME; wait on Windows, replace the process on POSIX."""
    if not os.environ.get("DSH_HOME", "").strip():
        print(
            message("home_required"),
            file=sys.stderr,
        )
        raise SystemExit(2)
    argv = (*resolve_bundled_launch_args(), *sys.argv[1:])
    if sys.platform == "win32":
        # Windows CRT exec does not replace the process; wait and preserve the runtime status.
        raise SystemExit(subprocess.run(argv, env=os.environ).returncode)
    os.execvpe(argv[0], argv, os.environ)


__all__ = [
    "PACKAGE_METADATA_FILENAME",
    "RUNTIME_MODE_ENV_VAR",
    "bundled_package_dir",
    "bundled_runtime_path",
    "download_office",
    "download_primary_runtime",
    "resolve_office_launch_args",
    "main",
    "resolve_bundled_launch_args",
]
