#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  echo "Run this script as the regular ubuntu user, not as root."
  exit 1
fi

echo "Installing Docker, Compose plugin, and Git..."
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git curl openssl

echo "Enabling Docker service..."
sudo systemctl enable --now docker

if ! groups "${USER}" | grep -q '\bdocker\b'; then
  echo "Adding ${USER} to docker group..."
  sudo usermod -aG docker "${USER}"
  echo
  echo "Docker group added. Log out and SSH back in once, then continue."
  echo "After reconnecting, run:"
  echo "  bash scripts/oracle/prepare-env.sh YOUR_SERVER_IP"
  exit 0
fi

echo
echo "Bootstrap complete."
echo "Next:"
echo "  bash scripts/oracle/prepare-env.sh YOUR_SERVER_IP"
echo "  docker compose up -d --build"
