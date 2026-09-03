import smtplib
import subprocess
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from scraper.amazon import Job


def send_desktop_notification(title: str, message: str) -> None:
    escaped_title = title.replace('"', '\\"')
    escaped_message = message.replace('"', '\\"')
    script = (
        f'display notification "{escaped_message}" '
        f'with title "{escaped_title}" sound name "Glass"'
    )
    try:
        subprocess.run(["osascript", "-e", script], check=False, capture_output=True)
    except OSError:
        pass


def send_email(
    sender_email: str,
    sender_password: str,
    recipient_email: str,
    jobs: list[Job],
    subject: str | None = None,
) -> None:
    if not jobs:
        return

    subject = subject or f"🚀 {len(jobs)} New Amazon SWE Role(s) (Last 24h)!"
    rows = []
    for job in jobs:
        rows.append(
            f"""
            <tr>
              <td style="padding:12px;border-bottom:1px solid #eee;">
                <a href="{job.url}" style="color:#ff9900;font-weight:bold;text-decoration:none;">
                  {job.title}
                </a>
              </td>
              <td style="padding:12px;border-bottom:1px solid #eee;">{job.location}</td>
              <td style="padding:12px;border-bottom:1px solid #eee;">{job.team or job.business_category}</td>
              <td style="padding:12px;border-bottom:1px solid #eee;">{job.posted_date}</td>
            </tr>
            """
        )

    html = f"""
    <html><body style="font-family:Arial,sans-serif;color:#232f3e;">
      <h2 style="color:#ff9900;">Amazon New Grad / Entry-Level SWE Roles</h2>
      <p>Found <strong>{len(jobs)}</strong> new role(s) posted in the last 24 hours:</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#232f3e;color:white;">
            <th style="padding:12px;text-align:left;">Title</th>
            <th style="padding:12px;text-align:left;">Location</th>
            <th style="padding:12px;text-align:left;">Team</th>
            <th style="padding:12px;text-align:left;">Posted</th>
          </tr>
        </thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
      <p style="color:#666;font-size:12px;margin-top:24px;">
        Sent by SWE Notifier — checks every 2 hours, alerts on roles posted in the last 24 hours.
      </p>
    </body></html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
