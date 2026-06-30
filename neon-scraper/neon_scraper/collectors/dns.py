"""Passive DNS collector."""

from __future__ import annotations

from datetime import UTC, datetime

from neon_scraper.collectors.base import Collector
from neon_scraper.core.models import Finding, Target


class DnsCollector(Collector):
    name = "dns"
    source_type = "dns"

    def __init__(self, timeout_seconds: int = 10) -> None:
        try:
            import dns.exception
            import dns.resolver
        except ModuleNotFoundError as error:
            raise RuntimeError(
                "The DNS collector requires dnspython. Install the project with "
                "`pip install -e .` or install `dnspython>=2.6.1`."
            ) from error

        self.dns_exception = dns.exception
        self.dns_resolver = dns.resolver
        self.resolver = dns.resolver.Resolver()
        self.resolver.lifetime = timeout_seconds
        self.resolver.timeout = timeout_seconds

    def collect(self, target: Target) -> list[Finding]:
        if target.target_type != "domain":
            return []

        findings: list[Finding] = []
        for record_type in ("A", "AAAA", "MX", "NS", "TXT"):
            findings.extend(self._query_record(target, record_type))

        dmarc_target = Target(value=f"_dmarc.{target.value}", target_type="domain")
        findings.extend(self._query_record(dmarc_target, "TXT", original_target=target))
        return findings

    def _query_record(
        self,
        target: Target,
        record_type: str,
        original_target: Target | None = None,
    ) -> list[Finding]:
        result_target = original_target or target

        try:
            answers = self.resolver.resolve(target.value, record_type)
        except (
            self.dns_resolver.NXDOMAIN,
            self.dns_resolver.NoAnswer,
            self.dns_resolver.NoNameservers,
            self.dns_exception.Timeout,
        ):
            return []

        collected_at = datetime.now(UTC)
        return [
            Finding(
                target=result_target.value,
                target_type=result_target.target_type,
                source=self.name,
                source_type=self.source_type,
                title=f"{record_type} record",
                value=answer.to_text(),
                risk=self._risk_for_record(record_type, answer.to_text()),
                confidence="high",
                collected_at=collected_at,
            )
            for answer in answers
        ]

    @staticmethod
    def _risk_for_record(record_type: str, value: str) -> str:
        normalized = value.lower()
        if record_type == "TXT" and "v=spf1" in normalized and "-all" not in normalized:
            return "low"
        if record_type == "TXT" and "v=dmarc1" in normalized and "p=none" in normalized:
            return "low"
        return "info"
