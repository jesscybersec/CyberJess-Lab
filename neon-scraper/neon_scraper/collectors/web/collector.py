"""Passive web scraper collector."""

from __future__ import annotations

from datetime import UTC, datetime
import urllib.error
from urllib.parse import urldefrag, urljoin, urlparse

from neon_scraper.analysis.matchers import match_keywords, match_target
from neon_scraper.collectors.base import Collector
from neon_scraper.collectors.web.client import WebClient
from neon_scraper.collectors.web.extractor import extract_links, extract_text
from neon_scraper.collectors.web.policy import is_url_allowed
from neon_scraper.collectors.web.robots import RobotsChecker
from neon_scraper.core.models import Finding, RequestLog, Target, WebSource
from neon_scraper.utils.rate_limit import RateLimiter


class WebCollector(Collector):
    name = "web"
    source_type = "web"

    def __init__(
        self,
        sources: list[WebSource],
        client: WebClient,
        robots_checker: RobotsChecker,
        snippet_radius: int,
        max_depth: int,
        max_pages_per_source: int,
        rate_limiter: RateLimiter | None = None,
    ) -> None:
        self.sources = [source for source in sources if source.enabled]
        self.client = client
        self.robots_checker = robots_checker
        self.snippet_radius = snippet_radius
        self.max_depth = max(max_depth, 0)
        self.max_pages_per_source = max(max_pages_per_source, 1)
        self.rate_limiter = rate_limiter or RateLimiter(0)
        self.request_logs: list[RequestLog] = []

    def collect(self, target: Target) -> list[Finding]:
        findings: list[Finding] = []
        for source in self.sources:
            source_findings = self._collect_source(source, target)
            findings.extend(source_findings)
        return findings

    def _collect_source(self, source: WebSource, target: Target) -> list[Finding]:
        findings: list[Finding] = []
        queue = [(url, 0) for url in source.seed_urls]
        seen: set[str] = set()
        fetched_count = 0

        while queue and fetched_count < self.max_pages_per_source:
            url, depth = queue.pop(0)
            normalized_url = normalize_url(url)
            if normalized_url in seen:
                continue
            seen.add(normalized_url)

            page_findings, discovered_urls, fetched = self._collect_url(
                source,
                target,
                normalized_url,
            )
            findings.extend(page_findings)
            if fetched:
                fetched_count += 1

            if depth >= self.max_depth:
                continue

            for discovered_url in discovered_urls:
                discovered_url = normalize_url(discovered_url)
                if discovered_url in seen:
                    continue
                allowed, reason = is_url_allowed(source, discovered_url)
                if not allowed:
                    self._log_request(
                        source,
                        discovered_url,
                        False,
                        blocked_reason=f"crawl_discovery:{reason}",
                    )
                    continue
                queue.append((discovered_url, depth + 1))

        return findings

    def _collect_url(
        self,
        source: WebSource,
        target: Target,
        url: str,
    ) -> tuple[list[Finding], list[str], bool]:
        allowed, reason = is_url_allowed(source, url)
        if not allowed:
            self._log_request(source, url, False, blocked_reason=reason)
            return (
                [self._policy_finding(source, target, url, reason or "blocked_by_policy")],
                [],
                False,
            )

        if not self.robots_checker.can_fetch(url):
            self._log_request(source, url, False, blocked_reason="blocked_by_robots_txt")
            return (
                [self._policy_finding(source, target, url, "blocked_by_robots_txt")],
                [],
                False,
            )

        try:
            self.rate_limiter.wait(urlparse(url).netloc)
            result = self.client.get(url)
        except (TimeoutError, urllib.error.URLError) as error:
            self._log_request(source, url, True, blocked_reason=f"request_failed:{error}")
            return (
                [self._policy_finding(source, target, url, f"request_failed:{error}")],
                [],
                False,
            )

        self._log_request(
            source,
            result.url,
            True,
            status_code=result.status_code,
            content_sha256=result.content_sha256,
        )

        if "html" not in result.content_type.lower():
            return (
                [self._policy_finding(source, target, url, "non_html_response")],
                [],
                True,
            )

        title, text = extract_text(result.text)
        links = [
            urljoin(result.url, link)
            for link in extract_links(result.text)
            if is_crawlable_link(link)
        ]
        matches = match_target(text, target.value, target.target_type, self.snippet_radius)
        matches.extend(match_keywords(text, source.keywords, self.snippet_radius))
        if not matches:
            return [], links, True

        collected_at = datetime.now(UTC)
        findings = [
            Finding(
                target=target.value,
                target_type=target.target_type,
                source=source.name,
                source_type=self.source_type,
                title=f"{title or 'Public web mention'} [{match.match_type}]",
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
        return findings, links, True

    def _policy_finding(
        self,
        source: WebSource,
        target: Target,
        url: str,
        reason: str,
    ) -> Finding:
        return Finding(
            target=target.value,
            target_type=target.target_type,
            source=source.name,
            source_type=self.source_type,
            title="Source skipped by policy",
            value=f"{url} skipped: {reason}",
            url=url,
            risk="info",
            confidence="high",
        )

    def _log_request(
        self,
        source: WebSource,
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


def is_crawlable_link(link: str) -> bool:
    if not link or link.startswith(("#", "mailto:", "tel:", "javascript:")):
        return False
    return True
