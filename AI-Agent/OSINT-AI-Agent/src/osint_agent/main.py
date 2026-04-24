from __future__ import annotations

import argparse
from pathlib import Path

from osint_agent.models import Target
from osint_agent.profiles import list_profiles
from osint_agent.pipeline import Pipeline
from osint_agent.reporting import render_markdown_report
from osint_agent.settings import Settings
from osint_agent.tools._common import slugify


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Controlled OSINT pipeline runner.")
    parser.add_argument("target", help="Target value, for example example.com")
    parser.add_argument(
        "--target-type",
        default="domain",
        choices=["domain", "subdomain", "ip", "organization", "company", "email", "username", "person_name", "phone"],
        help="Target type",
    )
    parser.add_argument(
        "--active",
        action="store_true",
        help="Allow non-passive execution where implemented",
    )
    parser.add_argument(
        "--profile",
        default="default",
        choices=list_profiles(),
        help="Investigation profile controlling pivot strategy and collector behavior",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    settings = Settings()

    target = Target(
        value=args.target,
        type=args.target_type,
        passive_only=not args.active,
        tags=[args.profile],
    )

    pipeline = Pipeline(settings)
    report = pipeline.run(target, profile_id=args.profile)

    output_path = settings.output_dir / f"{slugify(target.value)}_{args.profile}.md"
    render_markdown_report(report, Path("./templates"), output_path)

    print(f"Report generated: {output_path}")


if __name__ == "__main__":
    main()
