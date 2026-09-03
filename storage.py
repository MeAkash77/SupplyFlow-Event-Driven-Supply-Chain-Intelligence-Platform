import json
from pathlib import Path

from config import SEEN_JOBS_FILE


def load_seen_ids() -> set[str]:
    if not SEEN_JOBS_FILE.exists():
        return set()
    try:
        data = json.loads(SEEN_JOBS_FILE.read_text())
        return set(data.get("seen_ids", []))
    except (json.JSONDecodeError, OSError):
        return set()


def save_seen_ids(seen_ids: set[str]) -> None:
    SEEN_JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SEEN_JOBS_FILE.write_text(json.dumps({"seen_ids": sorted(seen_ids)}, indent=2))


def mark_seen(job_ids: list[str]) -> None:
    seen = load_seen_ids()
    seen.update(job_ids)
    save_seen_ids(seen)
