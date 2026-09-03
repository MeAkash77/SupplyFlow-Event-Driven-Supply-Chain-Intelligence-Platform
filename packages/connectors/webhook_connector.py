from __future__ import annotations

from .base import ConnectorResult
from .http_adapter import HTTPConnector


class WebhookConnector(HTTPConnector):
    """
    Connector for the n8n / webhook integration pattern.

    EasyFlow doesn't call the ERP directly — instead:
      1. n8n fetches data from the ERP on a schedule
      2. n8n POSTs the normalised payload to /api/webhooks/inbound/{tenant_id}

    This connector's test_connection() checks that the n8n instance is reachable
    and the webhook endpoint in EasyFlow is healthy.
    """

    def __init__(self, n8n_base_url: str, webhook_token: str, source: str = "n8n"):
        super().__init__(
            base_url=n8n_base_url,
            headers={"X-Webhook-Token": webhook_token},
        )
        self.source = source

    async def test_connection(self) -> ConnectorResult:
        """Ping the n8n health endpoint to verify it's reachable."""
        try:
            resp = await self._request("GET", "/healthz")
            if 200 <= resp.status < 400:
                return ConnectorResult(
                    success=True,
                    details={
                        "message": f"n8n is reachable at {self.base_url}",
                        "source": self.source,
                        "status": resp.status,
                    },
                )
            return ConnectorResult(
                success=False,
                details={"error": f"n8n returned {resp.status}", "source": self.source},
            )
        except Exception as exc:
            return ConnectorResult(
                success=False,
                details={
                    "error": str(exc),
                    "hint": (
                        "Make sure n8n is running (docker compose up n8n) "
                        "and the base URL is correct."
                    ),
                    "source": self.source,
                },
            )

    async def fetch_master_data(self, params=None) -> ConnectorResult:
        """
        n8n pushes data to EasyFlow — we don't pull.
        This method returns instructions instead of fetching.
        """
        return ConnectorResult(
            success=True,
            details={
                "message": (
                    "Data is pushed to EasyFlow by n8n workflows. "
                    "Check /api/webhooks/events for received events."
                ),
                "source": self.source,
                "pattern": "push (ERP → n8n → EasyFlow webhook)",
            },
        )
