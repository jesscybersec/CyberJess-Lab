"""Tor source allowlist policy."""

from __future__ import annotations

from pathlib import Path
import tomllib
from urllib.parse import urlparse

from neon_scraper.collectors.tor.validator import TorValidationError, validate_onion_url
from neon_scraper.core.models import TorSource


def load_tor_sources(path: Path) -> list[TorSource]:
    if not path.exists():
        return []

    with path.open("rb") as source_file:
        raw = tomllib.load(source_file)

    sources = []
    for item in raw.get("sources", []):
        sources.append(
            TorSource(
                name=str(item["name"]),
                base_url=str(item["base_url"]),
                enabled=bool(item.get("enabled", False)),
                seed_urls=tuple(item.get("seed_urls", [str(item["base_url"])])),
                allowed_paths=tuple(item.get("allowed_paths", ["/"])),
                blocked_patterns=tuple(item.get("blocked_patterns", [])),
                keywords=tuple(item.get("keywords", [])),
                notes=str(item.get("notes", "")),
            )
        )
    return sources


def is_tor_url_allowed(source: TorSource, url: str) -> tuple[bool, str | None]:
    try:
        validate_onion_url(source.base_url)
        validate_onion_url(url)
    except TorValidationError as error:
        return False, str(error)

    base = urlparse(source.base_url)
    parsed = urlparse(url)
    if parsed.netloc != base.netloc:
        return False, "outside_onion_host"

    path = parsed.path or "/"
    if source.blocked_patterns and any(
        pattern in path for pattern in source.blocked_patterns
    ):
        return False, "blocked_pattern"
    if not any(path.startswith(allowed_path) for allowed_path in source.allowed_paths):
        return False, "path_not_allowlisted"
    return True, None

