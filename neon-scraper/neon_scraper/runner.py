"""Shared scan runner helpers for CLI and web UI."""

from __future__ import annotations

from types import SimpleNamespace

from neon_scraper.collectors.dns import DnsCollector
from neon_scraper.collectors.tor.client import TorClient
from neon_scraper.collectors.tor.collector import TorCollector
from neon_scraper.collectors.tor.policy import load_tor_sources
from neon_scraper.collectors.web.client import WebClient
from neon_scraper.collectors.web.collector import WebCollector
from neon_scraper.collectors.web.policy import load_web_sources
from neon_scraper.collectors.web.robots import RobotsChecker
from neon_scraper.config import Config
from neon_scraper.core.models import Target
from neon_scraper.utils.rate_limit import RateLimiter


def build_collectors(
    args: SimpleNamespace,
    config: Config,
    targets: list[Target],
) -> list:
    collectors = []

    if not args.no_web and config.web.enabled:
        sources = load_web_sources(config.web.sources_file)
        if sources:
            collectors.append(
                WebCollector(
                    sources=sources,
                    client=WebClient(
                        user_agent=config.collection.user_agent,
                        timeout_seconds=config.collection.timeout_seconds,
                        max_response_bytes=config.web.max_response_bytes,
                    ),
                    robots_checker=RobotsChecker(
                        user_agent=config.collection.user_agent,
                        enabled=config.web.respect_robots_txt,
                    ),
                    snippet_radius=config.web.snippet_radius,
                    max_depth=config.web.max_depth,
                    max_pages_per_source=config.web.max_pages_per_source,
                    rate_limiter=RateLimiter(config.collection.rate_limit_seconds),
                )
            )

    if getattr(args, "include_tor", False) and config.tor.enabled:
        sources = load_tor_sources(config.tor.allowlist_file)
        if sources:
            proxy_url = (
                f"{config.tor.proxy_scheme}://"
                f"{config.tor.proxy_host}:{config.tor.proxy_port}"
            )
            collectors.append(
                TorCollector(
                    sources=sources,
                    client=TorClient(
                        proxy_url=proxy_url,
                        user_agent=config.tor.user_agent,
                        timeout_seconds=config.tor.timeout_seconds,
                        max_response_bytes=config.tor.max_response_bytes,
                    ),
                    snippet_radius=config.web.snippet_radius,
                    rate_limiter=RateLimiter(config.tor.rate_limit_seconds),
                )
            )

    has_domain_targets = any(target.target_type == "domain" for target in targets)
    if not args.no_dns and has_domain_targets:
        try:
            collectors.append(
                DnsCollector(timeout_seconds=config.collection.timeout_seconds)
            )
        except RuntimeError as error:
            print(f"[dns] skipped: {error}")

    return collectors


def collect_request_logs(collectors: list) -> list:
    logs = []
    for collector in collectors:
        logs.extend(getattr(collector, "request_logs", []))
    return logs
