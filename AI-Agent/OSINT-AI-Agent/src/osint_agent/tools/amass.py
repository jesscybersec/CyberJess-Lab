from __future__ import annotations

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import DOMAIN_PATTERN, run_command, unique_strings, write_raw_output


def run(target: Target, settings: Settings) -> list[Observable]:
    if target.type not in {"domain", "subdomain", "organization", "company"}:
        return []

    command = [settings.amass_binary, "enum", "-passive", "-norecursive", "-noalts", "-d", target.value]
    result = run_command(command, timeout=300)
    if not result.found:
        return []

    if result.stdout:
        write_raw_output(settings.data_dir, "amass", target.value, "txt", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "amass", f"{target.value}_stderr", "log", result.stderr)

    matches = unique_strings(DOMAIN_PATTERN.findall(result.stdout))
    return [
        Observable(
            type="domain",
            value=match,
            source="amass",
            confidence=0.82,
            tags=["infrastructure", "subdomain-enum", "passive"],
        )
        for match in matches
    ]
