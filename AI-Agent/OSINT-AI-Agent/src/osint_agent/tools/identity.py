from __future__ import annotations

from pathlib import Path
from urllib.parse import quote_plus

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import load_json_file, run_command, write_raw_output
from osint_agent.tools.variants import username_variants


def _parse_phoneinfoga_output(stdout: str) -> list[Observable]:
    observables: list[Observable] = []
    field_map = {
        "country": "phone_country",
        "carrier": "phone_carrier",
        "line type": "phone_line_type",
        "e164": "phone_e164",
        "international": "phone_international",
        "number": "phone_number",
    }

    for raw_line in stdout.splitlines():
        line = raw_line.strip()
        if not line or ":" not in line:
            continue

        key, value = [part.strip() for part in line.split(":", 1)]
        lowered = key.lower()
        if lowered == "url":
            observables.append(
                Observable(
                    type="search_url",
                    value=value,
                    source="phoneinfoga",
                    confidence=0.65,
                    tags=["phone", "pivot-url"],
                )
            )
            continue

        observable_type = field_map.get(lowered)
        if observable_type and value:
            observables.append(
                Observable(
                    type=observable_type,
                    value=value,
                    source="phoneinfoga",
                    confidence=0.8,
                    tags=["phone", lowered.replace(" ", "_")],
                )
            )
    return observables


def _phone_search_urls(phone_value: str) -> list[Observable]:
    query = quote_plus(phone_value)
    urls = [
        ("google_phone_general", f"https://www.google.com/search?q=%22{query}%22"),
        ("google_phone_social", f"https://www.google.com/search?q=site%3Afacebook.com+OR+site%3Alinkedin.com+OR+site%3Ax.com+%22{query}%22"),
    ]
    return [
        Observable(
            type="search_url",
            value=url,
            source=source,
            confidence=0.45,
            tags=["phone", "public-search"],
        )
        for source, url in urls
    ]


def _person_name_search_urls(name: str) -> list[Observable]:
    query = quote_plus(name)
    urls = [
        ("google_person_general", f"https://www.google.com/search?q=%22{query}%22"),
        ("google_person_social", f"https://www.google.com/search?q=site%3Alinkedin.com+OR+site%3Afacebook.com+OR+site%3Ax.com+%22{query}%22"),
        ("google_person_documents", f"https://www.google.com/search?q=%22{query}%22+%28filetype%3Apdf+OR+filetype%3Adocx%29"),
        ("google_person_images", f"https://www.google.com/search?tbm=isch&q=%22{query}%22"),
        ("google_person_github", f"https://www.google.com/search?q=site%3Agithub.com+%22{query}%22"),
    ]
    return [
        Observable(
            type="search_url",
            value=url,
            source=source,
            confidence=0.4,
            tags=["person", "public-search"],
        )
        for source, url in urls
    ]


def _email_search_urls(email_value: str) -> list[Observable]:
    query = quote_plus(email_value)
    local_part = email_value.split("@", 1)[0]
    variant_queries = username_variants(local_part)[:5]

    observables = [
        Observable(
            type="search_url",
            value=f"https://www.google.com/search?q=%22{query}%22",
            source="google_email_general",
            confidence=0.4,
            tags=["email", "public-search"],
        ),
        Observable(
            type="search_url",
            value=f"https://github.com/search?q={query}&type=commits",
            source="github_email_search",
            confidence=0.35,
            tags=["email", "github"],
        ),
    ]

    for variant in variant_queries:
        observables.append(
            Observable(
                type="candidate_username",
                value=variant,
                source="email_local_part",
                confidence=0.45,
                tags=["email", "pivot", "username-candidate"],
            )
        )
    return observables


def _run_h8mail(target: Target, settings: Settings) -> list[Observable]:
    if target.type != "email":
        return []

    json_path = settings.data_dir / "raw" / "h8mail" / f"{target.value.replace('/', '_')}.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    result = run_command([settings.h8mail_binary, "-t", target.value, "-j", str(json_path)], timeout=300)

    if result.stdout:
        write_raw_output(settings.data_dir, "h8mail", f"{target.value}_stdout", "log", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "h8mail", f"{target.value}_stderr", "log", result.stderr)
    if not result.found:
        return []

    parsed = load_json_file(json_path)
    if not isinstance(parsed, dict):
        return []

    targets = parsed.get("targets")
    if not isinstance(targets, list) or not targets:
        return []

    first = targets[0]
    if not isinstance(first, dict):
        return []

    observables: list[Observable] = []
    pwn_num = first.get("pwn_num")
    if pwn_num is not None:
        observables.append(
            Observable(
                type="breach_count",
                value=str(pwn_num),
                source="h8mail",
                confidence=0.8,
                tags=["email", "breach"],
            )
        )

    data = first.get("data")
    if isinstance(data, list):
        for row in data[:25]:
            if not isinstance(row, list):
                continue
            for item in row:
                if not isinstance(item, str):
                    continue
                observables.append(
                    Observable(
                        type="breach_artifact",
                        value=item,
                        source="h8mail",
                        confidence=0.7,
                        tags=["email", "breach-artifact"],
                    )
                )
    return observables


def run(target: Target, settings: Settings) -> list[Observable]:
    observables: list[Observable] = []

    if target.type == "phone":
        observables.extend(_phone_search_urls(target.value))
        result = run_command([settings.phoneinfoga_binary, "scan", "-n", target.value], timeout=300)
        if result.stdout:
            write_raw_output(settings.data_dir, "phoneinfoga", target.value, "txt", result.stdout)
            observables.extend(_parse_phoneinfoga_output(result.stdout))
        if result.stderr:
            write_raw_output(settings.data_dir, "phoneinfoga", f"{target.value}_stderr", "log", result.stderr)

    if target.type == "person_name":
        observables.extend(_person_name_search_urls(target.value))

    if target.type == "email":
        observables.extend(_email_search_urls(target.value))
        observables.extend(_run_h8mail(target, settings))

    return observables
