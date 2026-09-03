import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import requests

BASE_URL = "https://www.amazon.jobs/en/search.json"

SEARCH_QUERIES = [
    "software engineer",
    "SDE I",
    "software engineer I",
    "new grad",
    "university",
    "entry level software",
]

EXPERIENCE_LEVELS = [
    "less_than_1_year",
    "1_year",
    "2_years",
    "3_years",
]

SENIOR_PATTERN = re.compile(
    r"\b(senior|sr\.?|principal|staff|lead|manager|director|"
    r"architect|distinguished|fellow|iii|iv|v|vi|head of)\b",
    re.IGNORECASE,
)

ENTRY_TITLE_PATTERN = re.compile(
    r"\b(sde\s*i\b|software\s+engineer\s+i\b|software\s+development\s+engineer\s+i\b|"
    r"new\s+grad|university|entry[\s-]?level|junior|associate\s+engineer|"
    r"software\s+engineer\b(?!\s*(ii|iii|iv|v)))",
    re.IGNORECASE,
)

UPDATED_TIME_PATTERN = re.compile(
    r"(?:about\s+)?(\d+)\s+(minute|hour|day|week|month)s?",
    re.IGNORECASE,
)

STATE_ABBREV = {
    "California": "California",
    "Texas": "Texas",
    "Washington": "Washington",
    "CA": "California",
    "TX": "Texas",
    "WA": "Washington",
}


@dataclass
class Job:
    id: str
    title: str
    location: str
    city: str
    state: str
    team: str
    posted_date: str
    updated_time: str
    url: str
    business_category: str
    posted_at: datetime | None = None
    recency: datetime = field(default_factory=datetime.min)

    def display_line(self) -> str:
        return f"{self.title} — {self.location}"


def _parse_updated_time(text: str) -> timedelta | None:
    if not text:
        return None
    match = UPDATED_TIME_PATTERN.search(text.strip())
    if not match:
        return None
    amount = int(match.group(1))
    unit = match.group(2).lower()
    if unit.startswith("minute"):
        return timedelta(minutes=amount)
    if unit.startswith("hour"):
        return timedelta(hours=amount)
    if unit.startswith("day"):
        return timedelta(days=amount)
    if unit.startswith("week"):
        return timedelta(weeks=amount)
    if unit.startswith("month"):
        return timedelta(days=amount * 30)
    return None


def _parse_posted_date(text: str) -> datetime | None:
    if not text:
        return None
    try:
        return datetime.strptime(text, "%B %d, %Y")
    except ValueError:
        return None


def _job_recency(raw: dict) -> datetime:
    delta = _parse_updated_time(raw.get("updated_time", ""))
    if delta is not None:
        return datetime.now() - delta
    posted = _parse_posted_date(raw.get("posted_date", ""))
    if posted is not None:
        return posted
    return datetime.min


def _is_within_hours(raw: dict, max_hours: int) -> bool:
    delta = _parse_updated_time(raw.get("updated_time", ""))
    if delta is not None:
        return delta <= timedelta(hours=max_hours)

    posted = _parse_posted_date(raw.get("posted_date", ""))
    if posted is None:
        return False

    cutoff = datetime.now() - timedelta(hours=max_hours)
    return posted >= cutoff.replace(hour=0, minute=0, second=0, microsecond=0)


def _build_params(
    query: str,
    experience: str,
    states: list[str],
    cities: list[str],
    business_categories: list[str],
    offset: int = 0,
) -> list[tuple[str, str]]:
    params: list[tuple[str, str]] = [
        ("offset", str(offset)),
        ("result_limit", "100"),
        ("sort", "relevant"),
        ("category[]", "software-development"),
        ("job_type[]", "Full-Time"),
        ("country[]", "USA"),
        ("is_manager[]", "0"),
        ("base_query", query),
        ("industry_experience", experience),
    ]
    for state in states:
        params.append(("state[]", STATE_ABBREV.get(state, state)))
    for city in cities:
        params.append(("city[]", city))
    for category in business_categories:
        params.append(("business_category[]", category))
    return params


def _is_entry_level(job: dict) -> bool:
    title = job.get("title", "")
    if SENIOR_PATTERN.search(title):
        return False
    if job.get("is_manager"):
        return False
    if ENTRY_TITLE_PATTERN.search(title):
        return True
    qualifications = job.get("basic_qualifications", "")
    if re.search(r"\b(0[\s-]?2|1\+?|2\+?|3\+?)\s*years?\b", qualifications, re.I):
        if not re.search(r"\b([4-9]|\d{2,})\+?\s*years?\b", qualifications, re.I):
            return True
    return False


def _parse_job(raw: dict) -> Job:
    team_label = ""
    team = raw.get("team")
    if isinstance(team, dict):
        team_label = team.get("label") or team.get("title") or ""
    posted_date = raw.get("posted_date", "")
    return Job(
        id=str(raw.get("id_icims") or raw.get("id")),
        title=raw.get("title", "Unknown"),
        location=raw.get("location", raw.get("normalized_location", "")),
        city=raw.get("city", ""),
        state=raw.get("state", ""),
        team=team_label,
        posted_date=posted_date,
        updated_time=raw.get("updated_time", ""),
        url="https://www.amazon.jobs" + raw.get("job_path", ""),
        business_category=raw.get("business_category", ""),
        posted_at=_parse_posted_date(posted_date),
        recency=_job_recency(raw),
    )


def _fetch_page(params: list[tuple[str, str]]) -> list[dict]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
    }
    response = requests.get(BASE_URL, params=params, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json().get("jobs", [])


def fetch_entry_level_jobs(
    states: list[str] | None = None,
    cities: list[str] | None = None,
    business_categories: list[str] | None = None,
    max_job_age_hours: int = 24,
) -> list[Job]:
    states = states or ["California", "Texas", "Washington"]
    cities = cities or []
    business_categories = business_categories or ["amazon-web-services"]

    seen_ids: set[str] = set()
    jobs: list[Job] = []

    for query in SEARCH_QUERIES:
        for experience in EXPERIENCE_LEVELS:
            offset = 0
            while offset < 300:
                params = _build_params(
                    query, experience, states, cities, business_categories, offset
                )
                try:
                    raw_jobs = _fetch_page(params)
                except requests.RequestException:
                    break
                if not raw_jobs:
                    break
                for raw in raw_jobs:
                    if raw.get("country_code") != "USA":
                        continue
                    if not _is_entry_level(raw):
                        continue
                    if not _is_within_hours(raw, max_job_age_hours):
                        continue
                    job = _parse_job(raw)
                    if job.id not in seen_ids:
                        seen_ids.add(job.id)
                        jobs.append(job)
                if len(raw_jobs) < 100:
                    break
                offset += 100

    jobs.sort(key=lambda j: j.recency, reverse=True)
    return jobs
