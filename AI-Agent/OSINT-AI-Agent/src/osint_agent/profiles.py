from __future__ import annotations

from dataclasses import dataclass, field

from osint_agent.models import Observable, Target
from osint_agent.tools.variants import username_variants


@dataclass(slots=True)
class InvestigationProfile:
    profile_id: str
    name: str
    description: str
    tags: list[str] = field(default_factory=list)
    force_enable: list[str] = field(default_factory=list)
    source_hubs: list[tuple[str, str]] = field(default_factory=list)


PROFILE_REGISTRY: dict[str, InvestigationProfile] = {
    "default": InvestigationProfile(
        profile_id="default",
        name="Default",
        description="Balanced controlled OSINT workflow.",
        tags=["default"],
        force_enable=[],
        source_hubs=[
            ("awesome_osint", "https://github.com/jivoi/awesome-osint"),
            ("osint_framework", "https://osintframework.com/"),
        ],
    ),
    "max_coverage": InvestigationProfile(
        profile_id="max_coverage",
        name="Max Coverage",
        description="Broad OSINT workflow using all relevant collector families and curated hub references.",
        tags=["max-coverage", "broad-osint"],
        force_enable=["amass", "bbot", "theharvester", "spiderfoot", "social", "identity", "company_registry"],
        source_hubs=[
            ("awesome_osint", "https://github.com/jivoi/awesome-osint"),
            ("osint_framework", "https://osintframework.com/"),
            ("startme_osint4all", "https://start.me/p/L1rEYQ/osint4all"),
        ],
    ),
    "canada_localization": InvestigationProfile(
        profile_id="canada_localization",
        name="Canada Localization",
        description="Canada-focused workflow for people, company, and location-heavy OSINT.",
        tags=["canada", "geo", "province", "municipality"],
        force_enable=["social", "identity", "company_registry", "spiderfoot", "theharvester"],
        source_hubs=[
            ("startme_canada", "https://start.me/p/aLe0vp/osint-resources-in-canada"),
            ("startme_osint4all", "https://start.me/p/L1rEYQ/osint4all"),
            ("awesome_osint", "https://github.com/jivoi/awesome-osint"),
            ("osint_framework", "https://osintframework.com/"),
        ],
    ),
}


def get_profile(profile_id: str) -> InvestigationProfile:
    return PROFILE_REGISTRY.get(profile_id, PROFILE_REGISTRY["default"])


def list_profiles() -> list[str]:
    return sorted(PROFILE_REGISTRY.keys())


def profile_reference_observables(target: Target, profile: InvestigationProfile) -> list[Observable]:
    observables = [
        Observable(
            type="resource_hub",
            value=url,
            source=hub_id,
            confidence=0.6,
            tags=["profile-hub", profile.profile_id],
        )
        for hub_id, url in profile.source_hubs
    ]

    if profile.profile_id == "max_coverage":
        observables.extend(_max_coverage_pivots(target))

    if profile.profile_id == "canada_localization":
        observables.extend(_canada_localization_pivots(target))

    return observables


def _max_coverage_pivots(target: Target) -> list[Observable]:
    query = target.value.replace(" ", "+")
    pivots: list[tuple[str, str]] = []

    if target.type in {"username", "person_name"}:
        for variant in username_variants(target.value)[:6]:
            pivots.append(("variant_search", f"https://www.google.com/search?q=%22{variant.replace(' ', '+')}%22"))
        pivots.extend(
            [
                ("archive_search", f"https://webcache.allorigins.win/raw?url=https://www.google.com/search?q=%22{query}%22"),
                ("images_search", f"https://www.google.com/search?tbm=isch&q=%22{query}%22"),
            ]
        )

    if target.type in {"company", "organization", "domain"}:
        pivots.extend(
            [
                ("crtsh_lookup", f"https://crt.sh/?q={query}"),
                ("urlscan_search", f"https://urlscan.io/search/#domain:{query}"),
                ("github_code_search", f"https://github.com/search?q={query}&type=code"),
            ]
        )

    if target.type == "email":
        pivots.extend(
            [
                ("hibp_reference", "https://haveibeenpwned.com/"),
                ("google_email_files", f"https://www.google.com/search?q=%22{query}%22+%28filetype%3Apdf+OR+filetype%3Acsv%29"),
            ]
        )

    return [
        Observable(type="search_url", value=url, source=source, confidence=0.5, tags=["profile-pivot", "max-coverage"])
        for source, url in pivots
    ]


def _canada_localization_pivots(target: Target) -> list[Observable]:
    query = target.value.replace(" ", "+")
    pivots: list[tuple[str, str]] = [
        ("google_maps_canada", f"https://www.google.com/maps/search/?api=1&query={query}+Canada"),
        ("openstreetmap_search", f"https://www.openstreetmap.org/search?query={query}%20Canada"),
    ]

    if target.type in {"person_name", "phone"}:
        pivots.extend(
            [
                ("google_canada411", f"https://www.google.com/search?q=site%3Acanada411.ca+%22{query}%22"),
                ("google_gc_ca", f"https://www.google.com/search?q=site%3Agc.ca+%22{query}%22"),
                ("google_canlii", f"https://www.google.com/search?q=site%3Acanlii.org+%22{query}%22"),
            ]
        )

    if target.type in {"company", "organization", "person_name"}:
        pivots.extend(
            [
                ("google_opencanada", f"https://www.google.com/search?q=site%3Aopen.canada.ca+%22{query}%22"),
                ("google_sedar", f"https://www.google.com/search?q=site%3Asedarplus.ca+%22{query}%22"),
                ("google_canada_business", f"https://www.google.com/search?q=site%3Asearchapi.mrasservice.ca+%22{query}%22"),
            ]
        )

    return [
        Observable(type="search_url", value=url, source=source, confidence=0.55, tags=["profile-pivot", "canada"])
        for source, url in pivots
    ]
