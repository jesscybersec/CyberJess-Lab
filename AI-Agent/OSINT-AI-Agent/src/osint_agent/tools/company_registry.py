from __future__ import annotations

from urllib.parse import quote_plus

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings


def run(target: Target, settings: Settings) -> list[Observable]:
    if target.type not in {"company", "organization", "person_name"}:
        return []

    query = quote_plus(target.value)
    registry_urls = [
        ("opencorporates", f"https://opencorporates.com/companies?q={query}"),
        ("canada_business", f"https://searchapi.mrasservice.ca/Search?SearchText={query}"),
        ("sec_edgar", f"https://www.sec.gov/edgar/search/#/q={query}"),
    ]

    return [
        Observable(
            type="registry_search_url",
            value=url,
            source=source,
            confidence=0.5,
            tags=["company", "registry", "pivot"],
        )
        for source, url in registry_urls
    ]
