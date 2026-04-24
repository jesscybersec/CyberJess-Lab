from __future__ import annotations

from collections import OrderedDict

from osint_agent.models import Finding, Observable, ReportData, Target
from osint_agent.profiles import InvestigationProfile, get_profile, profile_reference_observables
from osint_agent.settings import Settings
from osint_agent.tools import amass, bbot, company_registry, identity, social, spiderfoot, theharvester


class Pipeline:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def run(self, target: Target, profile_id: str = "default") -> ReportData:
        profile = get_profile(profile_id)
        observables: list[Observable] = []

        enabled = set(profile.force_enable)

        if (self.settings.enable_amass or "amass" in enabled) and target.type in {"domain", "subdomain", "organization", "company"}:
            observables.extend(amass.run(target, self.settings))
        if (self.settings.enable_bbot or "bbot" in enabled) and target.type in {"domain", "subdomain", "ip", "organization", "company"}:
            observables.extend(bbot.run(target, self.settings))
        if (self.settings.enable_theharvester or "theharvester" in enabled) and target.type in {"domain", "organization", "company", "email"}:
            observables.extend(theharvester.run(target, self.settings))
        if (self.settings.enable_spiderfoot or "spiderfoot" in enabled) and target.type in {"domain", "organization", "company", "email", "username", "person_name", "phone"}:
            observables.extend(spiderfoot.run(target, self.settings))
        if (self.settings.enable_social or "social" in enabled) and target.type in {"username", "person_name", "organization", "company", "email"}:
            observables.extend(social.run(target, self.settings))
        if (self.settings.enable_identity or "identity" in enabled) and target.type in {"person_name", "email", "phone"}:
            observables.extend(identity.run(target, self.settings))
        if (self.settings.enable_company_registry or "company_registry" in enabled) and target.type in {"company", "organization", "person_name"}:
            observables.extend(company_registry.run(target, self.settings))
        observables.extend(profile_reference_observables(target, profile))

        deduped = self._dedupe_observables(observables)
        findings = self._build_findings(target, deduped, profile)
        return ReportData(
            target=target.value,
            mode="passive" if target.passive_only else self.settings.default_mode,
            profile=profile.profile_id,
            findings=findings,
            observables=deduped,
        )

    def _dedupe_observables(self, observables: list[Observable]) -> list[Observable]:
        keyed: OrderedDict[tuple[str, str, str], Observable] = OrderedDict()
        for observable in observables:
            key = (observable.type, observable.value, observable.source)
            keyed[key] = observable
        return list(keyed.values())

    def _build_findings(self, target: Target, observables: list[Observable], profile: InvestigationProfile) -> list[Finding]:
        findings: list[Finding] = []

        findings.append(
            Finding(
                title="Investigation profile selected",
                description=f"Profile '{profile.profile_id}' is active. {profile.description}",
                severity="info",
                source="profile",
                confidence=0.95,
            )
        )

        if observables:
            findings.append(
                Finding(
                    title="Initial observable set collected",
                    description=f"{len(observables)} observables were collected during the initial pipeline run for target type '{target.type}'.",
                    severity="info",
                    source="pipeline",
                    confidence=0.8,
                )
            )
        else:
            findings.append(
                Finding(
                    title="No collector output produced",
                    description="No observables were produced by the enabled collectors for this target. On Kali, verify that the relevant binaries are installed and reachable in PATH or configured via environment variables.",
                    severity="low",
                    source="pipeline",
                    confidence=0.92,
                )
            )

        if target.type in {"username", "email", "phone", "person_name"}:
            findings.append(
                Finding(
                    title="OSINT identity pivot workflow enabled",
                    description="Identity-oriented target types trigger public search pivots and, when installed, Kali-friendly tools such as socialscan, maigret, phoneinfoga, and h8mail.",
                    severity="info",
                    source="pipeline",
                    confidence=0.86,
                )
            )

        if profile.profile_id == "max_coverage":
            findings.append(
                Finding(
                    title="Max coverage profile expanded pivoting",
                    description="The workflow added curated OSINT hub references and broader pivot URLs to widen coverage beyond direct binary collectors.",
                    severity="info",
                    source="profile",
                    confidence=0.9,
                )
            )

        if profile.profile_id == "canada_localization":
            findings.append(
                Finding(
                    title="Canada localization profile expanded regional research",
                    description="The workflow added Canada-focused geolocation, registry, and public-search pivots informed by the configured Canada OSINT hub strategy.",
                    severity="info",
                    source="profile",
                    confidence=0.9,
                )
            )

        findings.append(
            Finding(
                title="Controlled pipeline checkpoint required",
                description="Collected results should be reviewed by an analyst before any final intelligence product is published or shared.",
                severity="info",
                source="pipeline",
                confidence=0.9,
            )
        )
        return findings
