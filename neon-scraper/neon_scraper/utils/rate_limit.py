"""Small per-key rate limiter."""

from __future__ import annotations

import time


class RateLimiter:
    def __init__(self, delay_seconds: int) -> None:
        self.delay_seconds = max(delay_seconds, 0)
        self._last_seen: dict[str, float] = {}

    def wait(self, key: str) -> None:
        if self.delay_seconds <= 0:
            return

        now = time.monotonic()
        last_seen = self._last_seen.get(key)
        if last_seen is not None:
            elapsed = now - last_seen
            remaining = self.delay_seconds - elapsed
            if remaining > 0:
                time.sleep(remaining)
        self._last_seen[key] = time.monotonic()
