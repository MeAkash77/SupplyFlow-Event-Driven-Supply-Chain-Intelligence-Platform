import json
import threading
import webbrowser
from datetime import datetime

import customtkinter as ctk

from config import WIDGET_STATE_FILE, Config
from notifier import send_desktop_notification, send_email
from scraper.amazon import Job, fetch_entry_level_jobs
from storage import load_seen_ids, mark_seen

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class JobCard(ctk.CTkFrame):
    def __init__(self, master, job: Job, is_new: bool = False, **kwargs):
        super().__init__(master, **kwargs)
        self.job = job
        self.configure(fg_color="#1a2332" if is_new else "#232f3e", corner_radius=8)

        badge = "🆕 " if is_new else ""
        title_btn = ctk.CTkButton(
            self,
            text=f"{badge}{job.title}",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="transparent",
            hover_color="#2d3f54",
            anchor="w",
            command=lambda: webbrowser.open(job.url),
        )
        title_btn.pack(fill="x", padx=8, pady=(8, 2))

        meta = ctk.CTkLabel(
            self,
            text=f"📍 {job.location}  ·  {job.posted_date}"
            + (f" ({job.updated_time})" if job.updated_time else ""),
            font=ctk.CTkFont(size=10),
            text_color="#8fa3b8",
            anchor="w",
        )
        meta.pack(fill="x", padx=10, pady=(0, 8))


class SWENotifierWidget(ctk.CTk):
    def __init__(self, config: Config):
        super().__init__()
        self.config = config
        self.all_jobs: list[Job] = []
        self.new_jobs: list[Job] = []
        self.is_checking = False
        self._timer: threading.Timer | None = None

        self._load_window_state()
        self._setup_window()
        self._build_ui()
        self.after(500, self.check_now)

    def _load_window_state(self) -> None:
        self._saved_x = None
        self._saved_y = None
        if WIDGET_STATE_FILE.exists():
            try:
                state = json.loads(WIDGET_STATE_FILE.read_text())
                self._saved_x = state.get("x")
                self._saved_y = state.get("y")
            except (json.JSONDecodeError, OSError):
                pass

    def _save_window_state(self) -> None:
        WIDGET_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        WIDGET_STATE_FILE.write_text(
            json.dumps({"x": self.winfo_x(), "y": self.winfo_y()}, indent=2)
        )

    def _setup_window(self) -> None:
        self.title("SWE Notifier")
        self.geometry("360x520")
        self.minsize(320, 400)
        self.attributes("-topmost", True)
        self.configure(fg_color="#131921")

        if self._saved_x is not None and self._saved_y is not None:
            self.geometry(f"360x520+{self._saved_x}+{self._saved_y}")
        else:
            self.geometry("360x520+50+80")

        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_ui(self) -> None:
        header = ctk.CTkFrame(self, fg_color="#232f3e", corner_radius=0, height=56)
        header.pack(fill="x")
        header.pack_propagate(False)

        title_frame = ctk.CTkFrame(header, fg_color="transparent")
        title_frame.pack(side="left", padx=12, pady=8)

        ctk.CTkLabel(
            title_frame,
            text="📋 Amazon SWE",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color="#ff9900",
        ).pack(anchor="w")

        self.status_label = ctk.CTkLabel(
            title_frame,
            text="Starting...",
            font=ctk.CTkFont(size=10),
            text_color="#8fa3b8",
        )
        self.status_label.pack(anchor="w")

        btn_frame = ctk.CTkFrame(header, fg_color="transparent")
        btn_frame.pack(side="right", padx=8)

        self.pin_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            btn_frame,
            text="📌",
            variable=self.pin_var,
            width=40,
            command=self._toggle_pin,
            font=ctk.CTkFont(size=14),
        ).pack(side="left", padx=2)

        ctk.CTkButton(
            btn_frame,
            text="↻",
            width=32,
            height=32,
            command=self.check_now,
            font=ctk.CTkFont(size=16),
        ).pack(side="left", padx=2)

        self.count_badge = ctk.CTkLabel(
            self,
            text="",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#ff9900",
            anchor="w",
        )
        self.count_badge.pack(fill="x", padx=14, pady=(10, 4))

        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=10, pady=(0, 8))

        footer = ctk.CTkFrame(self, fg_color="#232f3e", corner_radius=0, height=36)
        footer.pack(fill="x", side="bottom")
        footer.pack_propagate(False)

        self.footer_label = ctk.CTkLabel(
            footer,
            text=(
                f"Checks every {self.config.check_interval_hours}h"
                f" · Showing last {self.config.max_job_age_hours}h"
                f" · Drag to move"
            ),
            font=ctk.CTkFont(size=10),
            text_color="#8fa3b8",
        )
        self.footer_label.pack(pady=8)

        self._drag_data = {"x": 0, "y": 0}
        for widget in (header, footer):
            widget.bind("<ButtonPress-1>", self._start_drag)
            widget.bind("<B1-Motion>", self._on_drag)

    def _start_drag(self, event) -> None:
        self._drag_data["x"] = event.x
        self._drag_data["y"] = event.y

    def _on_drag(self, event) -> None:
        x = self.winfo_x() + event.x - self._drag_data["x"]
        y = self.winfo_y() + event.y - self._drag_data["y"]
        self.geometry(f"+{x}+{y}")

    def _toggle_pin(self) -> None:
        self.attributes("-topmost", self.pin_var.get())

    def _on_close(self) -> None:
        self._save_window_state()
        if self._timer:
            self._timer.cancel()
        self.destroy()

    def _set_status(self, text: str) -> None:
        self.status_label.configure(text=text)

    def _render_jobs(self) -> None:
        for widget in self.scroll.winfo_children():
            widget.destroy()

        new_ids = {j.id for j in self.new_jobs}
        if not self.all_jobs:
            ctk.CTkLabel(
                self.scroll,
                text=(
                    f"No roles posted in the last {self.config.max_job_age_hours} hours.\n"
                    "Will check again soon."
                ),
                font=ctk.CTkFont(size=12),
                text_color="#8fa3b8",
            ).pack(pady=40)
            return

        display_jobs = self.all_jobs[:20]
        for job in display_jobs:
            JobCard(self.scroll, job, is_new=job.id in new_ids).pack(
                fill="x", pady=4
            )

    def check_now(self) -> None:
        if self.is_checking:
            return
        self.is_checking = True
        self._set_status("Checking Amazon jobs...")
        threading.Thread(target=self._run_check, daemon=True).start()

    def _run_check(self) -> None:
        try:
            jobs = fetch_entry_level_jobs(
                states=self.config.states,
                cities=self.config.cities,
                business_categories=self.config.business_categories,
                max_job_age_hours=self.config.max_job_age_hours,
            )
            seen = load_seen_ids()
            new_jobs = [j for j in jobs if j.id not in seen]

            if new_jobs:
                if self.config.enable_email and self.config.email_configured():
                    send_email(
                        self.config.sender_email,
                        self.config.sender_password,
                        self.config.recipient_email,
                        new_jobs,
                    )
                if self.config.enable_desktop_notify:
                    send_desktop_notification(
                        "SWE Notifier",
                        f"{len(new_jobs)} new Amazon SWE role(s) found!",
                    )
                mark_seen([j.id for j in new_jobs])

            self.after(0, lambda: self._update_ui(jobs, new_jobs))
        except Exception as exc:
            self.after(0, lambda: self._set_status(f"Error: {exc}"))
            self.is_checking = False

    def _update_ui(self, jobs: list[Job], new_jobs: list[Job]) -> None:
        self.all_jobs = jobs
        self.new_jobs = new_jobs
        now = datetime.now().strftime("%I:%M %p")
        next_check = f"Next check in {self.config.check_interval_hours}h"

        if new_jobs:
            self.count_badge.configure(
                text=f"🆕 {len(new_jobs)} NEW role(s) in last {self.config.max_job_age_hours}h · {now}"
            )
            self._set_status(
                f"Last check: {now}  ·  {len(jobs)} role(s) in last {self.config.max_job_age_hours}h"
            )
        else:
            self.count_badge.configure(
                text=f"✓ No new roles  ·  {len(jobs)} in last {self.config.max_job_age_hours}h  ·  {now}"
            )
            self._set_status(f"{len(jobs)} in last {self.config.max_job_age_hours}h  ·  {next_check}")

        self._render_jobs()
        self.is_checking = False
        self._schedule_next_check()

    def _schedule_next_check(self) -> None:
        if self._timer:
            self._timer.cancel()
        interval = self.config.check_interval_hours * 3600
        self._timer = threading.Timer(interval, lambda: self.after(0, self.check_now))
        self._timer.daemon = True
        self._timer.start()


def run_app(config: Config | None = None) -> None:
    config = config or Config()
    app = SWENotifierWidget(config)
    app.mainloop()
