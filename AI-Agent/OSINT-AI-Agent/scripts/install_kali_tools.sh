#!/usr/bin/env bash
set -euo pipefail

SPIDERFOOT_DIR="${HOME}/tools/spiderfoot"

echo "[*] Updating apt package index..."
sudo apt update

echo "[*] Installing base dependencies..."
sudo apt install -y pipx jq curl git python3-venv amass theharvester

echo "[*] Ensuring pipx path..."
pipx ensurepath

echo "[*] Installing Python-based OSINT tools..."
pipx install socialscan || true
pipx install maigret || true
pipx install h8mail || true
pipx install ghunt || true
pipx install bbot || true

if [ ! -d "${SPIDERFOOT_DIR}" ]; then
  echo "[*] Cloning SpiderFoot into ${SPIDERFOOT_DIR} ..."
  mkdir -p "$(dirname "${SPIDERFOOT_DIR}")"
  git clone https://github.com/smicallef/spiderfoot.git "${SPIDERFOOT_DIR}" || true
else
  echo "[*] SpiderFoot directory already exists: ${SPIDERFOOT_DIR}"
fi

cat <<'EOF'

[*] Installed or prepared

- amass
- theHarvester
- socialscan
- maigret
- h8mail
- ghunt
- bbot

[*] Optional manual installs / follow-up

PhoneInfoga:
  https://sundowndev.github.io/phoneinfoga/getting-started/install/

theHarvester:
  Kali already ships it on recent versions according to the official installation wiki.

SpiderFoot:
  Source was cloned to ~/tools/spiderfoot if the directory did not already exist.
  Install its Python dependencies manually inside that directory if needed.

Curated source hubs to integrate into your workflow:
  https://github.com/jivoi/awesome-osint
  https://osintframework.com/
  https://start.me/p/aLe0vp/osint-resources-in-canada
  https://start.me/p/L1rEYQ/osint4all

Suggested environment variables for this project:

  export OSINT_AGENT_AMASS_BINARY=amass
  export OSINT_AGENT_BBOT_BINARY=bbot
  export OSINT_AGENT_THEHARVESTER_BINARY=theHarvester
  export OSINT_AGENT_SPIDERFOOT_PYTHON=python3
  export OSINT_AGENT_SPIDERFOOT_SCRIPT="$HOME/tools/spiderfoot/sf.py"

Suggested next checks:
  amass enum -h
  theHarvester -h
  socialscan --help
  maigret --help
  h8mail -h
  ghunt --help
  bbot --help
  python3 "$HOME/tools/spiderfoot/sf.py" --help

EOF
