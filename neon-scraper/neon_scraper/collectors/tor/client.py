"""HTTP client for allowlisted Tor sources."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib


@dataclass(frozen=True)
class TorHttpResult:
    url: str
    status_code: int
    content_type: str
    text: str
    content_sha256: str


class TorClient:
    def __init__(
        self,
        proxy_url: str,
        user_agent: str,
        timeout_seconds: int,
        max_response_bytes: int,
    ) -> None:
        self.proxy_url = proxy_url
        self.user_agent = user_agent
        self.timeout_seconds = timeout_seconds
        self.max_response_bytes = max_response_bytes

    def get(self, url: str) -> TorHttpResult:
        try:
            import requests
        except ModuleNotFoundError as error:
            raise RuntimeError(
                "Tor collection requires optional dependency `requests[socks]`. "
                "Install with `pip install -e \".[tor]\"`."
            ) from error

        response = requests.get(
            url,
            headers={"User-Agent": self.user_agent},
            proxies={"http": self.proxy_url, "https": self.proxy_url},
            timeout=self.timeout_seconds,
            allow_redirects=False,
        )
        raw = response.content[: self.max_response_bytes]
        encoding = response.encoding or "utf-8"
        return TorHttpResult(
            url=response.url,
            status_code=response.status_code,
            content_type=response.headers.get("Content-Type", ""),
            text=raw.decode(encoding, errors="replace"),
            content_sha256=hashlib.sha256(raw).hexdigest(),
        )

