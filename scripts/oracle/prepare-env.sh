#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

SERVER_IP="${1:-}"

if [[ -z "${SERVER_IP}" ]]; then
  echo "Usage: bash scripts/oracle/prepare-env.sh YOUR_SERVER_IP"
  exit 1
fi

if [[ ! -f ".env.example" ]]; then
  echo ".env.example not found."
  exit 1
fi

cp .env.example .env

auth_secret="$(openssl rand -hex 32)"
webhook_secret="$(openssl rand -hex 32)"

python3 - <<'PY' "${SERVER_IP}" "${auth_secret}" "${webhook_secret}"
from pathlib import Path
import sys

server_ip, auth_secret, webhook_secret = sys.argv[1:4]
path = Path(".env")
content = path.read_text()
replacements = {
    "APP_PUBLIC_URL=http://YOUR_SERVER_IP:3000": f"APP_PUBLIC_URL=http://{server_ip}:3000",
    "PUBLIC_API_URL=http://YOUR_SERVER_IP:8000": f"PUBLIC_API_URL=http://{server_ip}:8000",
    "N8N_PUBLIC_URL=http://YOUR_SERVER_IP:5678/": f"N8N_PUBLIC_URL=http://{server_ip}:5678/",
    "N8N_HOST=YOUR_SERVER_IP": f"N8N_HOST={server_ip}",
    "BETTER_AUTH_SECRET=change-this-auth-secret": f"BETTER_AUTH_SECRET={auth_secret}",
    "WEBHOOK_SECRET_KEY=change-this-webhook-secret": f"WEBHOOK_SECRET_KEY={webhook_secret}",
}
for old, new in replacements.items():
    content = content.replace(old, new)
path.write_text(content)
PY

echo ".env created for ${SERVER_IP}"
echo
echo "Next:"
echo "  docker compose up -d --build"
echo
echo "Then open:"
echo "  http://${SERVER_IP}:3000"
echo "  http://${SERVER_IP}:8000/health"
echo "  http://${SERVER_IP}:5678"
