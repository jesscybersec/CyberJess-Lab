from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(slots=True)
class Settings:
    output_dir: Path = Path(os.getenv("OSINT_AGENT_OUTPUT_DIR", "./reports"))
    data_dir: Path = Path(os.getenv("OSINT_AGENT_DATA_DIR", "./data"))
    default_mode: str = os.getenv("OSINT_AGENT_DEFAULT_MODE", "passive")
    enable_amass: bool = _get_bool("OSINT_AGENT_ENABLE_AMASS", True)
    enable_bbot: bool = _get_bool("OSINT_AGENT_ENABLE_BBOT", True)
    enable_theharvester: bool = _get_bool("OSINT_AGENT_ENABLE_THEHARVESTER", True)
    enable_spiderfoot: bool = _get_bool("OSINT_AGENT_ENABLE_SPIDERFOOT", False)
    enable_social: bool = _get_bool("OSINT_AGENT_ENABLE_SOCIAL", True)
    enable_identity: bool = _get_bool("OSINT_AGENT_ENABLE_IDENTITY", True)
    enable_company_registry: bool = _get_bool("OSINT_AGENT_ENABLE_COMPANY_REGISTRY", True)
    socialscan_binary: str = os.getenv("OSINT_AGENT_SOCIALSCAN_BINARY", "socialscan")
    maigret_binary: str = os.getenv("OSINT_AGENT_MAIGRET_BINARY", "maigret")
    phoneinfoga_binary: str = os.getenv("OSINT_AGENT_PHONEINFOGA_BINARY", "phoneinfoga")
    h8mail_binary: str = os.getenv("OSINT_AGENT_H8MAIL_BINARY", "h8mail")
    amass_binary: str = os.getenv("OSINT_AGENT_AMASS_BINARY", "amass")
    bbot_binary: str = os.getenv("OSINT_AGENT_BBOT_BINARY", "bbot")
    theharvester_binary: str = os.getenv("OSINT_AGENT_THEHARVESTER_BINARY", "theHarvester")
    spiderfoot_python: str = os.getenv("OSINT_AGENT_SPIDERFOOT_PYTHON", "python3")
    spiderfoot_script: str = os.getenv("OSINT_AGENT_SPIDERFOOT_SCRIPT", "sf.py")
