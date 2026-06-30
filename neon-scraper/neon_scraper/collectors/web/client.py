"""Minimal HTTP client for passive web scraping."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import urllib.error
import urllib.request


@dataclass(frozen=True)
class HttpResult:
    url: str
    status_code: int
    content_type: str
    text: str
    content_sha256: str


class WebClient:
    def __init__(
        self,
        user_agent: str,
        timeout_seconds: int,
        max_response_bytes: int,
    ) -> None:
        self.user_agent = user_agent
        self.timeout_seconds = timeout_seconds
        self.max_response_bytes = max_response_bytes

    def get(self, url: str) -> HttpResult:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": self.user_agent},
            method="GET",
        )
        with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
            raw = response.read(self.max_response_bytes + 1)
            if len(raw) > self.max_response_bytes:
                raw = raw[: self.max_response_bytes]
            content_type = response.headers.get("Content-Type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            text = raw.decode(charset, errors="replace")
            return HttpResult(
                url=response.geturl(),
                status_code=response.status,
                content_type=content_type,
                text=text,
                content_sha256=hashlib.sha256(raw).hexdigest(),
            )

