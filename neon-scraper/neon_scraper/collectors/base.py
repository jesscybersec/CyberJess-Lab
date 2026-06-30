"""Collector interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod

from neon_scraper.core.models import Finding, Target


class Collector(ABC):
    name: str
    source_type: str

    @abstractmethod
    def collect(self, target: Target) -> list[Finding]:
        """Collect passive findings for a target."""

