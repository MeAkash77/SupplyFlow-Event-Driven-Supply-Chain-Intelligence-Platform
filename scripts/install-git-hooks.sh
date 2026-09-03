#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

echo "Installed repo-local git hooks."
echo "Commits will now be blocked if env files, key files, or obvious secrets are staged."
