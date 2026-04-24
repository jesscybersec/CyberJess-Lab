from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal


TargetType = Literal[
    "domain",
    "subdomain",
    "ip",
    "organization",
    "company",
    "email",
    "username",
    "person_name",
    "phone",
]
Severity = Literal["info", "low", "medium", "high"]


@dataclass(slots=True)
class Target:
    value: str
    type: TargetType
    label: str | None = None
    passive_only: bool = True
    tags: list[str] = field(default_factory=list)


@dataclass(slots=True)
class Observable:
    type: str
    value: str
    source: str
    confidence: float = 0.5
    tags: list[str] = field(default_factory=list)
    collected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class Finding:
    title: str
    description: str
    severity: Severity = "info"
    source: str = "pipeline"
    confidence: float = 0.5


@dataclass(slots=True)
class ReportData:
    target: str
    mode: str
    profile: str = "default"
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    findings: list[Finding] = field(default_factory=list)
    observables: list[Observable] = field(default_factory=list)
