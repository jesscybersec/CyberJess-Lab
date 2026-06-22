#!/usr/bin/env bash

set -Eeuo pipefail

readonly VENV_DIR="${VENV_DIR:-venv}"

echo "[+] Updating package metadata..."
sudo apt update

echo "[+] Installing system dependencies..."
sudo apt install -y \
  python3-full \
  python3-venv \
  ocrmypdf \
  tesseract-ocr \
  tesseract-ocr-eng \
  tesseract-ocr-fra

echo "[+] Creating virtual environment: ${VENV_DIR}"
python3 -m venv "${VENV_DIR}"

echo "[+] Installing Python dependencies..."
"${VENV_DIR}/bin/python" -m pip install --upgrade pip
"${VENV_DIR}/bin/python" -m pip install -r requirements.txt

echo "[+] Installation complete."
echo "[>] Run: source ${VENV_DIR}/bin/activate"
echo "[>] Then: streamlit run PDFMerger.py"
