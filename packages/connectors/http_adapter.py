from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import aiohttp

from .base import Connector, ConnectorResult


class HTTPConnector(Connector):
    def __init__(self, base_url: str, headers: Dict[str, str] | None = None, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}
        self.timeout = timeout

    async def _request(self, method: str, path: str, **kwargs) -> aiohttp.ClientResponse:
        url = f"{self.base_url}/{path.lstrip('/') }"
        timeout = aiohttp.ClientTimeout(total=self.timeout)
        async with aiohttp.ClientSession(headers=self.headers, timeout=timeout) as session:
            async with session.request(method, url, **kwargs) as resp:
                return resp

    async def test_connection(self) -> ConnectorResult:
        try:
            resp = await self._request("GET", "/")
            ok = 200 <= resp.status < 400
            text = await resp.text()
            return ConnectorResult(success=ok, details={"status": resp.status, "body_snippet": text[:300]})
        except asyncio.TimeoutError:
            return ConnectorResult(success=False, details={"error": "timeout"})
        except Exception as exc:  # pragma: no cover - best-effort
            return ConnectorResult(success=False, details={"error": str(exc)})

    async def fetch_master_data(self, params: Dict[str, Any] | None = None) -> ConnectorResult:
        try:
            resp = await self._request("GET", "/api/master-data", params=params or {})
            data = await resp.json()
            return ConnectorResult(success=True, details={"data": data})
        except Exception as exc:
            return ConnectorResult(success=False, details={"error": str(exc)})
