#!/bin/bash
cd "$(dirname "$0")"

PYTHON=""
for candidate in python3.12 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "Python 3 not found. Install Python 3.11+ first."
  exit 1
fi

if [ ! -d ".venv" ]; then
  "$PYTHON" -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

.venv/bin/python main.py
