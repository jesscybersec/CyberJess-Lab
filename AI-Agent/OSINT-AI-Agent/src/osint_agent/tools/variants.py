from __future__ import annotations

import re


def username_variants(value: str) -> list[str]:
    cleaned = value.strip()
    if not cleaned:
        return []

    variants = {
        cleaned,
        cleaned.lower(),
        cleaned.replace(" ", ""),
        cleaned.replace(" ", "."),
        cleaned.replace(" ", "_"),
        cleaned.replace("-", ""),
        cleaned.replace("-", "_"),
        re.sub(r"[^A-Za-z0-9._-]+", "", cleaned),
    }
    return [variant for variant in variants if variant]
