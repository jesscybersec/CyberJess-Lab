"""Strict .onion URL validation."""

from __future__ import annotations

import re
from urllib.parse import urlparse


ONION_V3_HOST = re.compile(r"^[a-z2-7]{56}\.onion$")


class TorValidationError(ValueError):
    """Raised when a Tor URL violates collector policy."""


def validate_onion_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise TorValidationError("unsupported_scheme")
    if parsed.username or parsed.password:
        raise TorValidationError("credentials_not_allowed")
    if not parsed.hostname or not ONION_V3_HOST.match(parsed.hostname.lower()):
        raise TorValidationError("invalid_onion_host")
    if parsed.fragment:
        raise TorValidationError("fragments_not_allowed")

