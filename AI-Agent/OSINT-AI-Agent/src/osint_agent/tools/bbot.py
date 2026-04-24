from __future__ import annotations

import json
from pathlib import Path

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import EMAIL_PATTERN, IPV4_PATTERN, URL_PATTERN, run_command, write_raw_output


def _event_to_observable(event: dict) -> Observable | None:
    event_type = str(event.get("type", "")).upper()
    data = str(event.get("data", "")).strip()
    tags = [str(tag) for tag in event.get("tags", []) if isinstance(tag, str)]

    if not data:
        return None

    if event_type == "DNS_NAME":
        return Observable(type="domain", value=data, source="bbot", confidence=0.84, tags=["bbot", *tags])
    if event_type == "EMAIL_ADDRESS":
        return Observable(type="email", value=data, source="bbot", confidence=0.84, tags=["bbot", *tags])
    if event_type == "URL":
        return Observable(type="url", value=data, source="bbot", confidence=0.82, tags=["bbot", *tags])
    if event_type == "IP_ADDRESS":
        return Observable(type="ip", value=data, source="bbot", confidence=0.82, tags=["bbot", *tags])
    if event_type == "OPEN_TCP_PORT":
        return Observable(type="open_port", value=data, source="bbot", confidence=0.8, tags=["bbot", *tags])
    return None


def run(target: Target, settings: Settings) -> list[Observable]:
    if target.type not in {"domain", "subdomain", "ip", "organization", "company"}:
        return []

    output_dir = settings.data_dir / "raw" / "bbot"
    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        settings.bbot_binary,
        "-t",
        target.value,
        "-p",
        "subdomain-enum",
        "email-enum",
        "-rf",
        "passive",
        "-om",
        "json",
        "--output",
        str(output_dir),
        "--name",
        target.value.replace("/", "_"),
    ]
    result = run_command(command, timeout=600)
    if not result.found:
        return []

    if result.stdout:
        write_raw_output(settings.data_dir, "bbot", target.value, "ndjson", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "bbot", f"{target.value}_stderr", "log", result.stderr)

    observables: list[Observable] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        observable = _event_to_observable(event)
        if observable is not None:
            observables.append(observable)

    if observables:
        return observables

    fallback: list[Observable] = []
    for match in EMAIL_PATTERN.findall(result.stdout):
        fallback.append(Observable(type="email", value=match, source="bbot", confidence=0.72, tags=["bbot", "regex"]))
    for match in IPV4_PATTERN.findall(result.stdout):
        fallback.append(Observable(type="ip", value=match, source="bbot", confidence=0.72, tags=["bbot", "regex"]))
    for match in URL_PATTERN.findall(result.stdout):
        fallback.append(Observable(type="url", value=match, source="bbot", confidence=0.72, tags=["bbot", "regex"]))
    return fallback
