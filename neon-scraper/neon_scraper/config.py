"""Application configuration loading."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tomllib


@dataclass(frozen=True)
class AppConfig:
    data_dir: Path
    database_path: Path
    reports_dir: Path
    log_level: str


@dataclass(frozen=True)
class CollectionConfig:
    user_agent: str
    timeout_seconds: int
    rate_limit_seconds: int


@dataclass(frozen=True)
class WebConfig:
    enabled: bool
    sources_file: Path
    respect_robots_txt: bool
    max_response_bytes: int
    snippet_radius: int
    interface_host: str
    interface_port: int
    max_depth: int
    max_pages_per_source: int


@dataclass(frozen=True)
class TorConfig:
    enabled: bool
    proxy_host: str
    proxy_port: int
    proxy_scheme: str
    rate_limit_seconds: int
    timeout_seconds: int
    user_agent: str
    allowlist_file: Path
    blocklist_file: Path
    log_requests: bool
    max_response_bytes: int


@dataclass(frozen=True)
class Config:
    app: AppConfig
    collection: CollectionConfig
    web: WebConfig
    tor: TorConfig


def default_config() -> Config:
    return Config(
        app=AppConfig(
            data_dir=Path("data"),
            database_path=Path("data/osint.sqlite"),
            reports_dir=Path("data/reports"),
            log_level="INFO",
        ),
        collection=CollectionConfig(
            user_agent="Neon-Scraper/0.1 passive exposure monitor",
            timeout_seconds=10,
            rate_limit_seconds=2,
        ),
        web=WebConfig(
            enabled=True,
            sources_file=Path("config/web_sources.toml"),
            respect_robots_txt=True,
            max_response_bytes=1_048_576,
            snippet_radius=80,
            interface_host="127.0.0.1",
            interface_port=8765,
            max_depth=1,
            max_pages_per_source=10,
        ),
        tor=TorConfig(
            enabled=False,
            proxy_host="127.0.0.1",
            proxy_port=9050,
            proxy_scheme="socks5h",
            rate_limit_seconds=30,
            timeout_seconds=10,
            user_agent="Neon-Scraper/0.1 passive tor monitor",
            allowlist_file=Path("config/tor_allowlist.toml"),
            blocklist_file=Path("config/tor_blocklist.toml"),
            log_requests=True,
            max_response_bytes=524_288,
        ),
    )


def load_config(path: Path | None = None) -> Config:
    if path is None or not path.exists():
        return default_config()

    with path.open("rb") as config_file:
        raw = tomllib.load(config_file)

    defaults = default_config()
    app = raw.get("app", {})
    collection = raw.get("collection", {})
    web = raw.get("web", {})
    tor = raw.get("tor", {})

    return Config(
        app=AppConfig(
            data_dir=Path(app.get("data_dir", defaults.app.data_dir)),
            database_path=Path(app.get("database_path", defaults.app.database_path)),
            reports_dir=Path(app.get("reports_dir", defaults.app.reports_dir)),
            log_level=app.get("log_level", defaults.app.log_level),
        ),
        collection=CollectionConfig(
            user_agent=collection.get("user_agent", defaults.collection.user_agent),
            timeout_seconds=int(
                collection.get(
                    "timeout_seconds",
                    defaults.collection.timeout_seconds,
                )
            ),
            rate_limit_seconds=int(
                collection.get(
                    "rate_limit_seconds",
                    defaults.collection.rate_limit_seconds,
                )
            ),
        ),
        web=WebConfig(
            enabled=bool(web.get("enabled", defaults.web.enabled)),
            sources_file=Path(web.get("sources_file", defaults.web.sources_file)),
            respect_robots_txt=bool(
                web.get("respect_robots_txt", defaults.web.respect_robots_txt)
            ),
            max_response_bytes=int(
                web.get("max_response_bytes", defaults.web.max_response_bytes)
            ),
            snippet_radius=int(web.get("snippet_radius", defaults.web.snippet_radius)),
            interface_host=web.get("interface_host", defaults.web.interface_host),
            interface_port=int(web.get("interface_port", defaults.web.interface_port)),
            max_depth=int(web.get("max_depth", defaults.web.max_depth)),
            max_pages_per_source=int(
                web.get("max_pages_per_source", defaults.web.max_pages_per_source)
            ),
        ),
        tor=TorConfig(
            enabled=bool(tor.get("enabled", defaults.tor.enabled)),
            proxy_host=tor.get("proxy_host", defaults.tor.proxy_host),
            proxy_port=int(tor.get("proxy_port", defaults.tor.proxy_port)),
            proxy_scheme=tor.get("proxy_scheme", defaults.tor.proxy_scheme),
            rate_limit_seconds=int(
                tor.get("rate_limit_seconds", defaults.tor.rate_limit_seconds)
            ),
            timeout_seconds=int(tor.get("timeout_seconds", defaults.tor.timeout_seconds)),
            user_agent=tor.get("user_agent", defaults.tor.user_agent),
            allowlist_file=Path(
                tor.get("allowlist_file", defaults.tor.allowlist_file)
            ),
            blocklist_file=Path(
                tor.get("blocklist_file", defaults.tor.blocklist_file)
            ),
            log_requests=bool(tor.get("log_requests", defaults.tor.log_requests)),
            max_response_bytes=int(
                tor.get("max_response_bytes", defaults.tor.max_response_bytes)
            ),
        ),
    )
