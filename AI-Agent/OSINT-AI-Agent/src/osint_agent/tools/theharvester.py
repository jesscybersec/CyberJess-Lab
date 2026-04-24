from __future__ import annotations

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import DOMAIN_PATTERN, EMAIL_PATTERN, IPV4_PATTERN, run_command, unique_strings, write_raw_output


def run(target: Target, settings: Settings) -> list[Observable]:
    if target.type not in {"domain", "organization", "company", "email"}:
        return []

    query = target.value if target.type != "email" else target.value.split("@", 1)[-1]
    command = [settings.theharvester_binary, "-d", query, "-b", "all", "-l", "200"]
    result = run_command(command, timeout=600)
    if not result.found:
        return []

    if result.stdout:
        write_raw_output(settings.data_dir, "theharvester", target.value, "txt", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "theharvester", f"{target.value}_stderr", "log", result.stderr)

    observables: list[Observable] = []
    for match in unique_strings(EMAIL_PATTERN.findall(result.stdout)):
        observables.append(Observable(type="email", value=match, source="theHarvester", confidence=0.8, tags=["theharvester", "email-enum"]))
    for match in unique_strings(IPV4_PATTERN.findall(result.stdout)):
        observables.append(Observable(type="ip", value=match, source="theHarvester", confidence=0.76, tags=["theharvester", "host-enum"]))
    for match in unique_strings(DOMAIN_PATTERN.findall(result.stdout)):
        observables.append(Observable(type="domain", value=match, source="theHarvester", confidence=0.75, tags=["theharvester", "domain-enum"]))
    return observables
