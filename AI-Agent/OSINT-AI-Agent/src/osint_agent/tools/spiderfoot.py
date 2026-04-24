from __future__ import annotations

import json

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import DOMAIN_PATTERN, EMAIL_PATTERN, IPV4_PATTERN, URL_PATTERN, run_command, unique_strings, write_raw_output


def _spiderfoot_event_to_observable(item: dict) -> Observable | None:
    event_type = str(item.get("type", "")).upper()
    data = str(item.get("data", "")).strip()
    source = str(item.get("module", "spiderfoot"))
    if not data:
        return None

    if "EMAIL" in event_type:
        return Observable(type="email", value=data, source="spiderfoot", confidence=0.8, tags=["spiderfoot", source])
    if "PHONE" in event_type:
        return Observable(type="phone", value=data, source="spiderfoot", confidence=0.8, tags=["spiderfoot", source])
    if "DOMAIN" in event_type or "INTERNET_NAME" in event_type or "AFFILIATE" in event_type:
        return Observable(type="domain", value=data, source="spiderfoot", confidence=0.78, tags=["spiderfoot", source])
    if "IP" in event_type:
        return Observable(type="ip", value=data, source="spiderfoot", confidence=0.78, tags=["spiderfoot", source])
    if "URL" in event_type:
        return Observable(type="url", value=data, source="spiderfoot", confidence=0.78, tags=["spiderfoot", source])
    if "HUMAN_NAME" in event_type:
        return Observable(type="person_name", value=data, source="spiderfoot", confidence=0.72, tags=["spiderfoot", source])
    if "USERNAME" in event_type:
        return Observable(type="username", value=data, source="spiderfoot", confidence=0.72, tags=["spiderfoot", source])
    return None


def run(target: Target, settings: Settings) -> list[Observable]:
    supported_types = {"domain", "organization", "company", "email", "username", "person_name", "phone"}
    if target.type not in supported_types:
        return []

    command = [
        settings.spiderfoot_python,
        settings.spiderfoot_script,
        "-s",
        target.value,
        "-u",
        "passive",
        "-o",
        "json",
        "-H",
    ]
    result = run_command(command, timeout=600)
    if not result.found:
        return []

    if result.stdout:
        write_raw_output(settings.data_dir, "spiderfoot", target.value, "json", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "spiderfoot", f"{target.value}_stderr", "log", result.stderr)

    observables: list[Observable] = []
    try:
        payload = json.loads(result.stdout)
        if isinstance(payload, list):
            for item in payload:
                if not isinstance(item, dict):
                    continue
                observable = _spiderfoot_event_to_observable(item)
                if observable is not None:
                    observables.append(observable)
    except json.JSONDecodeError:
        pass

    if observables:
        return observables

    fallback: list[Observable] = []
    for match in unique_strings(EMAIL_PATTERN.findall(result.stdout)):
        fallback.append(Observable(type="email", value=match, source="spiderfoot", confidence=0.7, tags=["spiderfoot", "regex"]))
    for match in unique_strings(IPV4_PATTERN.findall(result.stdout)):
        fallback.append(Observable(type="ip", value=match, source="spiderfoot", confidence=0.7, tags=["spiderfoot", "regex"]))
    for match in unique_strings(URL_PATTERN.findall(result.stdout)):
        fallback.append(Observable(type="url", value=match, source="spiderfoot", confidence=0.7, tags=["spiderfoot", "regex"]))
    for match in unique_strings(DOMAIN_PATTERN.findall(result.stdout)):
        fallback.append(Observable(type="domain", value=match, source="spiderfoot", confidence=0.7, tags=["spiderfoot", "regex"]))
    return fallback
