from __future__ import annotations

from pathlib import Path

from osint_agent.models import ReportData


def render_markdown_report(report: ReportData, template_dir: Path, output_path: Path) -> Path:
    _ = template_dir
    lines: list[str] = [
        "# OSINT Report",
        "",
        "## Executive Summary",
        "",
        f"- Target: {report.target}",
        f"- Profile: {report.profile}",
        f"- Generated at: {report.generated_at.isoformat()}",
        f"- Mode: {report.mode}",
        f"- Total findings: {len(report.findings)}",
        "",
        "## Findings",
        "",
    ]

    if report.findings:
        for finding in report.findings:
            lines.extend(
                [
                    f"### {finding.title}",
                    "",
                    f"- Severity: {finding.severity}",
                    f"- Source: {finding.source}",
                    f"- Confidence: {finding.confidence}",
                    f"- Description: {finding.description}",
                    "",
                ]
            )
    else:
        lines.extend(["No findings were recorded.", ""])

    lines.extend(["## Observables", ""])
    if report.observables:
        lines.extend(["| Type | Value | Source |", "|---|---|---|"])
        for observable in report.observables:
            lines.append(f"| {observable.type} | {observable.value} | {observable.source} |")
        lines.append("")
    else:
        lines.extend(["No observables were collected.", ""])

    lines.extend(
        [
            "## Notes",
            "",
            "This report is generated from a controlled OSINT pipeline and should be reviewed by an analyst before redistribution.",
            "",
        ]
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
