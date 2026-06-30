"""Finding deduplication helpers."""

from __future__ import annotations

from neon_scraper.core.models import Finding


def deduplicate_findings(findings: list[Finding]) -> list[Finding]:
    seen: set[tuple[str, str, str, str, str]] = set()
    unique: list[Finding] = []

    for finding in findings:
        key = (
            finding.target,
            finding.target_type,
            finding.source,
            finding.title,
            finding.value,
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(finding)

    return unique

