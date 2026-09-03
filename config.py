import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path.home() / ".swe-notifier"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SEEN_JOBS_FILE = DATA_DIR / "seen_jobs.json"
WIDGET_STATE_FILE = DATA_DIR / "widget_state.json"


@dataclass
class Config:
    sender_email: str = field(default_factory=lambda: os.getenv("SENDER_EMAIL", ""))
    sender_password: str = field(default_factory=lambda: os.getenv("SENDER_PASSWORD", ""))
    recipient_email: str = field(default_factory=lambda: os.getenv("RECIPIENT_EMAIL", ""))
    check_interval_hours: int = field(
        default_factory=lambda: int(os.getenv("CHECK_INTERVAL_HOURS", "2"))
    )
    max_job_age_hours: int = field(
        default_factory=lambda: int(os.getenv("MAX_JOB_AGE_HOURS", "24"))
    )
    enable_email: bool = field(
        default_factory=lambda: os.getenv("ENABLE_EMAIL", "true").lower() == "true"
    )
    enable_desktop_notify: bool = field(
        default_factory=lambda: os.getenv("ENABLE_DESKTOP_NOTIFY", "true").lower() == "true"
    )
    states: list[str] = field(
        default_factory=lambda: [
            s.strip()
            for s in os.getenv("STATES", "California,Texas,Washington").split(",")
            if s.strip()
        ]
    )
    cities: list[str] = field(
        default_factory=lambda: [
            c.strip()
            for c in os.getenv("CITIES", "Cupertino,Austin,Seattle").split(",")
            if c.strip()
        ]
    )
    business_categories: list[str] = field(
        default_factory=lambda: [
            b.strip()
            for b in os.getenv("BUSINESS_CATEGORIES", "amazon-web-services").split(",")
            if b.strip()
        ]
    )

    def email_configured(self) -> bool:
        return bool(self.sender_email and self.sender_password and self.recipient_email)
