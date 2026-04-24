from __future__ import annotations

from urllib.parse import quote_plus

from osint_agent.models import Observable, Target
from osint_agent.settings import Settings
from osint_agent.tools._common import load_json_file, run_command, write_raw_output


def _build_public_search_observables(target: Target) -> list[Observable]:
    query = quote_plus(target.value)
    searches: list[tuple[str, str]] = []

    if target.type == "username":
        searches.extend(
            [
                ("github_search", f"https://github.com/search?q={query}&type=users"),
                ("reddit_search", f"https://www.reddit.com/search/?q={query}"),
                ("google_github", f"https://www.google.com/search?q=site%3Agithub.com+%22{query}%22"),
                ("google_social", f"https://www.google.com/search?q=site%3Ainstagram.com+OR+site%3Ax.com+OR+site%3Areddit.com+%22{query}%22"),
                ("whatsmyname", f"https://whatsmyname.app/?q={query}"),
                ("mastodon_search", f"https://www.google.com/search?q=site%3Amastodon.social+OR+site%3Ainfosec.exchange+%22{query}%22"),
                ("gitlab_search", f"https://gitlab.com/search?search={query}&group_id=&project_id=&repository_ref=&scope=users"),
            ]
        )
    elif target.type in {"person_name", "organization", "company"}:
        searches.extend(
            [
                ("google_general", f"https://www.google.com/search?q=%22{query}%22"),
                ("google_social", f"https://www.google.com/search?q=site%3Alinkedin.com+OR+site%3Ax.com+OR+site%3Areddit.com+%22{query}%22"),
                ("github_search", f"https://github.com/search?q={query}&type=users"),
            ]
        )

    return [
        Observable(
            type="search_url",
            value=url,
            source=source,
            confidence=0.4,
            tags=["pivot", "public-search"],
        )
        for source, url in searches
    ]


def _run_socialscan(target: Target, settings: Settings) -> list[Observable]:
    if target.type not in {"username", "email"}:
        return []

    json_path = settings.data_dir / "raw" / "socialscan" / f"{target.value.replace('/', '_')}.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    command = [settings.socialscan_binary, "--json", str(json_path), "--show-urls", target.value]
    result = run_command(command, timeout=180)

    if result.stdout:
        write_raw_output(settings.data_dir, "socialscan", f"{target.value}_stdout", "log", result.stdout)
    if result.stderr:
        write_raw_output(settings.data_dir, "socialscan", f"{target.value}_stderr", "log", result.stderr)

    parsed = load_json_file(json_path)
    if not isinstance(parsed, list):
        return []

    observables: list[Observable] = []
    observable_type = "social_profile" if target.type == "username" else "email_usage"
    for item in parsed:
        if not isinstance(item, dict):
            continue
        success = item.get("success")
        valid = item.get("valid")
        available = item.get("available")
        if success is not True or valid is not True or available is not False:
            continue

        platform = str(item.get("platform", "unknown"))
        url = item.get("url") or item.get("profile_url") or item.get("message") or target.value
        observables.append(
            Observable(
                type=observable_type,
                value=f"{platform}: {url}",
                source="socialscan",
                confidence=0.85,
                tags=["username" if target.type == "username" else "email", platform.lower()],
            )
        )
    return observables


def _run_maigret(target: Target, settings: Settings) -> list[Observable]:
    if target.type != "username":
        return []

    result = run_command([settings.maigret_binary, target.value, "--json", "ndjson"], timeout=300)
    if not result.found:
        return []

    raw_path = write_raw_output(settings.data_dir, "maigret", target.value, "ndjson", result.stdout)
    return [
        Observable(
            type="raw_artifact",
            value=str(raw_path),
            source="maigret",
            confidence=0.6,
            tags=["artifact", "maigret", "username"],
        )
    ]


def run(target: Target, settings: Settings) -> list[Observable]:
    observables: list[Observable] = []
    observables.extend(_build_public_search_observables(target))
    observables.extend(_run_socialscan(target, settings))
    observables.extend(_run_maigret(target, settings))
    return observables
