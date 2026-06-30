"""Source policy loading and URL authorization."""

from __future__ import annotations

from pathlib import Path
import tomllib
from urllib.parse import urlparse

from neon_scraper.core.models import WebSource


class SourcePolicyError(ValueError):
    """Raised when a web source policy is invalid."""


def load_web_sources(path: Path) -> list[WebSource]:
    if not path.exists():
        return []

    with path.open("rb") as source_file:
        raw = tomllib.load(source_file)

    sources = []
    for item in raw.get("sources", []):
        sources.append(
            WebSource(
                name=str(item["name"]),
                base_url=str(item["base_url"]),
                enabled=bool(item.get("enabled", True)),
                seed_urls=tuple(item.get("seed_urls", [str(item["base_url"])])),
                allowed_paths=tuple(item.get("allowed_paths", ["/"])),
                blocked_patterns=tuple(item.get("blocked_patterns", [])),
                keywords=tuple(item.get("keywords", [])),
                notes=str(item.get("notes", "")),
            )
        )
    return sources


def validate_source(source: WebSource) -> None:
    parsed = urlparse(source.base_url)
    if parsed.scheme not in {"http", "https"}:
        raise SourcePolicyError(f"Unsupported source scheme: {source.base_url}")
    if not parsed.netloc:
        raise SourcePolicyError(f"Source is missing a host: {source.base_url}")
    if parsed.hostname and parsed.hostname.endswith(".onion"):
        raise SourcePolicyError("Onion sources must use the isolated Tor module.")


def is_url_allowed(source: WebSource, url: str) -> tuple[bool, str | None]:
    validate_source(source)
    base = urlparse(source.base_url)
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        return False, "unsupported_scheme"
    if parsed.netloc != base.netloc:
        return False, "outside_source_host"
    if parsed.hostname and parsed.hostname.endswith(".onion"):
        return False, "onion_requires_tor_module"

    path = parsed.path or "/"
    if source.blocked_patterns and any(
        pattern in path for pattern in source.blocked_patterns
    ):
        return False, "blocked_pattern"
    if not any(path.startswith(allowed_path) for allowed_path in source.allowed_paths):
        return False, "path_not_allowlisted"
    return True, None
