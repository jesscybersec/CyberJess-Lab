"""robots.txt checks for passive scraping."""

from __future__ import annotations

from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser


class RobotsChecker:
    def __init__(self, user_agent: str, enabled: bool = True) -> None:
        self.user_agent = user_agent
        self.enabled = enabled
        self._cache: dict[str, RobotFileParser] = {}

    def can_fetch(self, url: str) -> bool:
        if not self.enabled:
            return True

        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        parser = self._cache.get(origin)
        if parser is None:
            parser = RobotFileParser()
            parser.set_url(urljoin(origin, "/robots.txt"))
            try:
                parser.read()
            except OSError:
                return False
            self._cache[origin] = parser
        return parser.can_fetch(self.user_agent, url)
