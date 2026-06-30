"""Passive allowlisted Tor collector."""

from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import urldefrag, urljoin

from neon_scraper.analysis.matchers import match_keywords, match_target
from neon_scraper.collectors.base import Collector
from neon_scraper.collectors.tor.client import TorClient
from neon_scraper.collectors.tor.policy import is_tor_url_allowed
from neon_scraper.collectors.web.extractor import extract_text
from neon_scraper.core.models import Finding, RequestLog, Target, TorSource
from neon_scraper.utils.rate_limit import RateLimiter


class TorCollector(Collector):
    name = "tor"
    source_type = "tor"

    def __init__(
        self,
        sources: list[TorSource],
        client: TorClient,
        snippet_radius: int,
        rate_limiter: RateLimiter,
    ) -> None:
        self.sources = [source for source in sources if source.enabled]
        self.client = client
        self.snippet_radius = snippet_radius
        self.rate_limiter = rate_limiter
        self.request_logs: list[RequestLog] = []

    def collect(self, target: Target) -> list[Finding]:
        findings: list[Finding] = []
        for source in self.sources:
            for url in source.seed_urls:
                findings.extend(self._collect_url(source, target, normalize_url(url)))
        return findings

    def _collect_url(
        self,
        source: TorSource,
        target: Target,
        url: str,
    ) -> list[Finding]:
        allowed, reason = is_tor_url_allowed(source, url)
        if not allowed:
            self._log_request(source, url, False, blocked_reason=reason)
            return []

        try:
            self.rate_limiter.wait(source.base_url)
            result = self.client.get(url)
        except Exception as error:
            self._log_request(source, url, True, blocked_reason=f"request_failed:{error}")
            return []

        self._log_request(
            source,
            result.url,
            True,
            status_code=result.status_code,
            content_sha256=result.content_sha256,
        )

        if "html" not in result.content_type.lower():
            return []

        title, text = extract_text(result.text)
        matches = match_target(text, target.value, target.target_type, self.snippet_radius)
        matches.extend(match_keywords(text, source.keywords, self.snippet_radius))

        collected_at = datetime.now(UTC)
        return [
            Finding(
                target=target.value,
                target_type=target.target_type,
                source=source.name,
                source_type=self.source_type,
                title=f"{title or 'Public onion mention'} [{match.match_type}]",
                value=(
                    f"match:{match.matched_value}\n"
                    f"snippet:{match.snippet}\n"
                    f"sha256:{result.content_sha256}"
                ),
                url=urljoin(result.url, ""),
                risk="info",
                confidence=match.confidence,
                collected_at=collected_at,
            )
            for match in matches
        ]

    def _log_request(
        self,
        source: TorSource,
        url: str,
        allowed_by_policy: bool,
        status_code: int | None = None,
        blocked_reason: str | None = None,
        content_sha256: str | None = None,
    ) -> None:
        self.request_logs.append(
            RequestLog(
                timestamp=datetime.now(UTC).isoformat(timespec="seconds"),
                source=source.name,
                source_type=self.source_type,
                url=url,
                method="GET",
                status_code=status_code,
                allowed_by_policy=allowed_by_policy,
                blocked_reason=blocked_reason,
                content_sha256=content_sha256,
            )
        )


def normalize_url(url: str) -> str:
    return urldefrag(url.strip())[0]
