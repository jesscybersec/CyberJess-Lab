"""Markdown report generation."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path
import sqlite3


def generate_markdown_report(
    findings: list[sqlite3.Row],
    output_dir: Path,
    request_logs: list[sqlite3.Row] | None = None,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    report_path = output_dir / f"neon-scraper-report-{timestamp}.md"

    grouped: dict[str, list[sqlite3.Row]] = defaultdict(list)
    for finding in findings:
        grouped[finding["source_type"]].append(finding)
    request_logs = request_logs or []
    risk_counts = Counter(finding["risk"] for finding in findings)
    blocked_requests = [
        row for row in request_logs if not bool(row["allowed_by_policy"])
    ]

    lines = [
        "# Neon Scraper Report",
        "",
        f"Generated: {datetime.now(UTC).isoformat(timespec='seconds')}",
        "",
        "## Legal And Ethical Notice",
        "",
        "This report was generated from passive, local-first collection. No "
        "authentication, bypassing, purchasing, exploitation, or interaction "
        "with restricted services was performed by the MVP collectors.",
        "",
        "## Executive Summary",
        "",
        f"- Total findings: {len(findings)}",
        f"- Source types: {', '.join(sorted(grouped)) if grouped else 'none'}",
        f"- Request audit events: {len(request_logs)}",
        f"- Blocked by policy/robots: {len(blocked_requests)}",
        f"- Risk summary: {format_counter(risk_counts)}",
        "",
    ]

    for source_type, source_findings in sorted(grouped.items()):
        lines.extend([f"## Source Type: {source_type}", ""])
        for finding in source_findings:
            lines.extend(
                [
                    f"### {finding['title']}",
                    "",
                    f"- Target: `{finding['target']}`",
                    f"- Target type: `{finding['target_type']}`",
                    f"- Source: `{finding['source']}`",
                    f"- Risk: `{finding['risk']}`",
                    f"- Confidence: `{finding['confidence']}`",
                    f"- Review status: `{finding['review_status']}`",
                    f"- Collected at: `{finding['collected_at']}`",
                    f"- Value: `{finding['value']}`",
                    "",
                ]
            )
            if finding["analyst_notes"]:
                lines.extend([f"- Analyst notes: `{finding['analyst_notes']}`", ""])

    if request_logs:
        lines.extend(["## Request Audit", ""])
        for row in request_logs[:25]:
            allowed = "allowed" if row["allowed_by_policy"] else "blocked"
            status = row["status_code"] if row["status_code"] is not None else "-"
            reason = row["blocked_reason"] or "-"
            lines.extend(
                [
                    f"- `{allowed}` `{row['method']}` {row['url']}",
                    f"  - Source: `{row['source']}`",
                    f"  - Status: `{status}`",
                    f"  - Reason: `{reason}`",
                    "",
                ]
            )

    if "tor" in grouped:
        lines.extend(
            [
                "## Reinforced Legal Notice For Tor Sources",
                "",
                "This report includes passive observations from explicitly "
                "allowlisted public .onion sources. No authentication, "
                "purchasing, bypassing, credential use, stolen dump downloading, "
                "or interactive access was performed.",
                "",
            ]
        )

    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path


def format_counter(counter: Counter) -> str:
    if not counter:
        return "none"
    return ", ".join(f"{key}={value}" for key, value in sorted(counter.items()))
