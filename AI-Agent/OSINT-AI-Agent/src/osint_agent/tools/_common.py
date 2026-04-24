from __future__ import annotations

import json
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class CommandResult:
    command: list[str]
    returncode: int
    stdout: str
    stderr: str
    found: bool


def find_binary(name: str) -> str | None:
    if Path(name).exists():
        return str(Path(name).resolve())
    return shutil.which(name)


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return slug.strip("._") or "target"


def run_command(command: list[str], timeout: int = 300) -> CommandResult:
    binary = find_binary(command[0])
    if binary is None:
        return CommandResult(command=command, returncode=127, stdout="", stderr="binary not found", found=False)

    resolved = [binary, *command[1:]]
    completed = subprocess.run(
        resolved,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
    )
    return CommandResult(
        command=resolved,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
        found=True,
    )


def write_raw_output(data_dir: Path, collector: str, target_value: str, suffix: str, content: str) -> Path:
    output_dir = data_dir / "raw" / collector
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slugify(target_value)}.{suffix}"
    output_path.write_text(content, encoding="utf-8")
    return output_path


def load_json_file(path: Path) -> object | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b", re.IGNORECASE)
IPV4_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
DOMAIN_PATTERN = re.compile(r"\b(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}\b", re.IGNORECASE)
URL_PATTERN = re.compile(r"https?://[^\s\"'>)]+", re.IGNORECASE)


def unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        lowered = value.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        output.append(value)
    return output
