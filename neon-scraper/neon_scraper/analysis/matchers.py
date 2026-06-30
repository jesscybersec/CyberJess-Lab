"""Target matching helpers."""

from __future__ import annotations

from dataclasses import dataclass
import re


EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
DOMAIN_PATTERN = re.compile(
    r"\b(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,}\b",
    re.I,
)


@dataclass(frozen=True)
class Match:
    match_type: str
    matched_value: str
    snippet: str
    confidence: str


def match_target(
    text: str,
    target_value: str,
    target_type: str,
    snippet_radius: int,
) -> list[Match]:
    if not target_value:
        return []

    if target_type == "email":
        return _match_pattern_value(text, target_value, "email", snippet_radius)
    if target_type == "domain":
        return _match_pattern_value(text, target_value, "domain", snippet_radius)
    if target_type == "username":
        return _match_wordish(text, target_value, "username", snippet_radius)
    if target_type == "organization":
        return _match_phrase(text, target_value, "organization", snippet_radius)
    return _match_phrase(text, target_value, "exact", snippet_radius)


def match_keywords(text: str, keywords: tuple[str, ...], snippet_radius: int) -> list[Match]:
    matches: list[Match] = []
    for keyword in keywords:
        matches.extend(_match_phrase(text, keyword, "keyword", snippet_radius))
    return matches


def _match_pattern_value(
    text: str,
    value: str,
    match_type: str,
    snippet_radius: int,
) -> list[Match]:
    pattern = EMAIL_PATTERN if match_type == "email" else DOMAIN_PATTERN
    matches = []
    for match in pattern.finditer(text):
        if match.group(0).lower() == value.lower():
            matches.append(
                Match(
                    match_type=match_type,
                    matched_value=match.group(0),
                    snippet=_snippet(text, match.start(), match.end(), snippet_radius),
                    confidence="high",
                )
            )
    return matches[:5]


def _match_wordish(
    text: str,
    value: str,
    match_type: str,
    snippet_radius: int,
) -> list[Match]:
    pattern = re.compile(rf"(?<![A-Z0-9_-]){re.escape(value)}(?![A-Z0-9_-])", re.I)
    return _pattern_matches(text, pattern, match_type, snippet_radius, "medium")


def _match_phrase(
    text: str,
    value: str,
    match_type: str,
    snippet_radius: int,
) -> list[Match]:
    pattern = re.compile(re.escape(value), re.I)
    return _pattern_matches(text, pattern, match_type, snippet_radius, "medium")


def _pattern_matches(
    text: str,
    pattern: re.Pattern,
    match_type: str,
    snippet_radius: int,
    confidence: str,
) -> list[Match]:
    matches = []
    for match in pattern.finditer(text):
        matches.append(
            Match(
                match_type=match_type,
                matched_value=match.group(0),
                snippet=_snippet(text, match.start(), match.end(), snippet_radius),
                confidence=confidence,
            )
        )
    return matches[:5]


def _snippet(text: str, start_index: int, end_index: int, radius: int) -> str:
    start = max(start_index - radius, 0)
    end = min(end_index + radius, len(text))
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"...{snippet}"
    if end < len(text):
        snippet = f"{snippet}..."
    return snippet
