"""Input validation helpers."""

from __future__ import annotations

import re


DOMAIN_PATTERN = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)"
    r"(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)


def normalize_domain(value: str) -> str:
    domain = value.strip().lower().rstrip(".")
    if not DOMAIN_PATTERN.match(domain):
        raise ValueError(f"Invalid domain: {value}")
    return domain

