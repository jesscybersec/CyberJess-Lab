"""Core data models."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class Target:
    value: str
    target_type: str


@dataclass(frozen=True)
class Finding:
    target: str
    target_type: str
    source: str
    source_type: str
    title: str
    value: str
    url: str | None = None
    risk: str = "info"
    confidence: str = "medium"
    collected_at: datetime | None = None

    def timestamp(self) -> str:
        collected_at = self.collected_at or datetime.now(UTC)
        return collected_at.isoformat(timespec="seconds")


@dataclass(frozen=True)
class WebSource:
    name: str
    base_url: str
    enabled: bool
    seed_urls: tuple[str, ...]
    allowed_paths: tuple[str, ...]
    blocked_patterns: tuple[str, ...]
    keywords: tuple[str, ...] = ()
    notes: str = ""


@dataclass(frozen=True)
class TorSource:
    name: str
    base_url: str
    enabled: bool
    seed_urls: tuple[str, ...]
    allowed_paths: tuple[str, ...]
    blocked_patterns: tuple[str, ...]
    keywords: tuple[str, ...] = ()
    notes: str = ""


@dataclass(frozen=True)
class RequestLog:
    timestamp: str
    source: str
    source_type: str
    url: str
    method: str
    allowed_by_policy: bool
    status_code: int | None = None
    blocked_reason: str | None = None
    content_sha256: str | None = None
