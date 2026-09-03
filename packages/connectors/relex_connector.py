from __future__ import annotations

from typing import Any, Dict

from .http_adapter import HTTPConnector
from .base import ConnectorResult


class RelexConnector(HTTPConnector):
    """Example connector for Relex-like REST APIs.

    Expects `base_url` and `api_key` header in config.
    """

    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
        super().__init__(base_url=base_url, headers=headers, timeout=timeout)

    async def test_connection(self) -> ConnectorResult:
        # Relex typically exposes health or version endpoints; try root or /health
        for p in ["/health", "/status", "/api/version", "/"]:
            res = await super()._request("GET", p)
            if 200 <= res.status < 400:
                text = await res.text()
                return ConnectorResult(success=True, details={"status": res.status, "path": p, "body_snippet": text[:300]})
        return ConnectorResult(success=False, details={"error": "no healthy endpoint found"})

    async def fetch_master_data(self, params: Dict[str, Any] | None = None) -> ConnectorResult:
        # Example: call an endpoint that returns SKUs or locations
        try:
            resp = await super()._request("GET", "/api/skus", params=params or {})
            data = await resp.json()
            return ConnectorResult(success=True, details={"count": len(data), "sample": data[:5]})
        except Exception as exc:
            return ConnectorResult(success=False, details={"error": str(exc)})
