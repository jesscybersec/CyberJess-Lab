# Kali Setup

## Goal

This setup is intended to maximize OSINT coverage while keeping the project auditable and step-driven.

## Recommended Tooling

- `socialscan` for accurate username and email usage checks
- `maigret` for username dossier collection across thousands of sites
- `phoneinfoga` for phone-number OSINT and pivot URL generation
- `h8mail` for email and breach-oriented enrichment
- `ghunt` for Google-account OSINT when you have a legitimate need and authenticated workflow
- `amass`, `bbot`, `theHarvester`, `spiderfoot` for technical and external-surface enrichment
- `awesome-osint` and `OSINT Framework` as source-hub maps for category selection rather than direct binaries
- `OSINT Resources in Canada` and `OSINT4ALL` Start.me pages as curated external hubs for regional and broad research expansion

## Suggested Install Flow

```bash
sudo apt update
sudo apt install -y pipx jq curl git python3-venv amass theharvester
pipx ensurepath

pipx install socialscan
pipx install maigret
pipx install h8mail
pipx install ghunt
pipx install bbot
```

PhoneInfoga official install guidance:

- binary and Docker options: [PhoneInfoga install](https://sundowndev.github.io/phoneinfoga/getting-started/install/)

SpiderFoot source-based setup:

```bash
mkdir -p ~/tools
git clone https://github.com/smicallef/spiderfoot.git ~/tools/spiderfoot
cd ~/tools/spiderfoot
pip3 install -r requirements.txt
python3 ./sf.py --help
```

## Environment Variables Expected By The Agent

For the infrastructure wrappers, the agent can read:

```bash
export OSINT_AGENT_AMASS_BINARY=amass
export OSINT_AGENT_BBOT_BINARY=bbot
export OSINT_AGENT_THEHARVESTER_BINARY=theHarvester
export OSINT_AGENT_SPIDERFOOT_PYTHON=python3
export OSINT_AGENT_SPIDERFOOT_SCRIPT="$HOME/tools/spiderfoot/sf.py"
```

You can also place these values in your `.env`.

## Quick Verification

```bash
amass enum -h
theHarvester -h
bbot --help
socialscan --help
maigret --help
h8mail -h
ghunt --help
python3 "$HOME/tools/spiderfoot/sf.py" --help
```

## Investigation Profiles

The project currently supports these profiles:

- `default`: balanced workflow
- `max_coverage`: force-enables relevant collector families and adds reference pivots from `awesome-osint`, `OSINT Framework`, and `OSINT4ALL`
- `canada_localization`: emphasizes Canada-focused geolocation, registry, public-search, and regional resource pivots

Examples:

```bash
python run.py example.com --target-type domain --profile max_coverage
python run.py "Jane Doe" --target-type person_name --profile canada_localization
```

Important:

- these profiles steer the agent strategy
- they do not automatically execute every tool listed in the external hubs
- they are used to widen pivots, force selected collectors, and annotate the final report

## Coverage Strategy

To get the maximum amount of useful information, split collection by pivot family:

1. Username
2. Email
3. Phone
4. Person name
5. Company / organization
6. Domain / infrastructure

Then correlate across them instead of relying on one tool alone.

## Best Current Open-Source Coverage Mix

As of April 23, 2026:

- `Maigret` remains one of the strongest username-centric dossier tools and its latest release is `v0.6.0` dated April 10, 2026. Source: [Maigret releases](https://github.com/soxoj/maigret/releases)
- `GHunt` latest release is `v2.2.0` dated June 6, 2025 and supports JSON export for email-oriented modules. Source: [GHunt README](https://github.com/mxrch/GHunt/blob/master/README.md), [GHunt releases](https://github.com/mxrch/GHunt/releases)
- `h8mail` latest release shown on GitHub is `2.5.6`, published June 25, 2025, and supports JSON output. Source: [h8mail releases](https://github.com/khast3x/h8mail/releases)
- `PhoneInfoga` is explicitly described by its maintainer as stable but unmaintained, so it is useful as a phone helper, but should not be your only phone OSINT source. Source: [PhoneInfoga README](https://github.com/sundowndev/phoneinfoga/blob/main/README.md)
- `socialscan` is still useful for high-accuracy username/email availability checks, but its public repo appears much less recently maintained than Maigret. Source: [socialscan README](https://github.com/iojw/socialscan/blob/master/README.md)
- `Amass` remains actively maintained, with latest release `v5.1.1` dated April 7, 2026, and its installation guide states it is installed by default on Kali or available via `apt install amass`. Sources: [Amass releases](https://github.com/owasp-amass/amass/releases), [Amass installation guide](https://github.com/owasp-amass/amass/wiki/Installation-Guide)
- `theHarvester` installation docs state that on recent Kali you can simply run `theHarvester -h`, and the latest visible GitHub release is `4.9.1`. Sources: [theHarvester installation wiki](https://github.com/laramies/theHarvester/wiki/Installation), [theHarvester releases](https://github.com/laramies/theHarvester/releases)
- `BBOT` is officially documented as Linux-only, installable via `pipx install bbot`, and supports JSON/TXT/CSV output. Sources: [BBOT getting started](https://www.blacklanternsecurity.com/bbot/Stable/), [BBOT output docs](https://www.blacklanternsecurity.com/bbot/Stable/scanning/output/)
- `SpiderFoot` OSS remains useful for multi-module OSINT with CLI and JSON/CSV export, but the latest visible OSS release remains `v4.0` from April 7, 2022. Source: [SpiderFoot GitHub](https://github.com/smicallef/spiderfoot)

## Practical Recommendation

If you want richer analysis, the most effective model is:

- `socialscan` for fast existence checks
- `maigret` for broad username correlation
- `h8mail` for email/breach enrichment
- `ghunt` for Google-specific enrichment when justified
- `phoneinfoga` for phone pivots
- `amass` / `bbot` / `theHarvester` for infrastructure pivots

Also treat these as curation layers:

- `awesome-osint` to discover categories you have not covered yet
- `OSINT Framework` to label tools by passive/active, local-install, registration, and dork/manual-URL behavior
- `OSINT Resources in Canada` to support Canada-focused geolocation and records work
- `OSINT4ALL` to widen pivot ideas across multiple OSINT domains

## Next Engineering Step

The next meaningful upgrade for this repository is to store raw outputs per collector, normalize them into a shared schema, and generate a report that groups results by:

- confirmed identifiers
- candidate identifiers
- breach artifacts
- social profiles
- registry/company links
- infrastructure artifacts
