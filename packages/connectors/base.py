from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Protocol


@dataclass
class ConnectorResult:
    success: bool
    details: Dict[str, Any]


class Connector(Protocol):
    """Connector interface every ERP connector should implement."""

    async def test_connection(self) -> ConnectorResult:
        ...

    async def fetch_master_data(self, params: Dict[str, Any] | None = None) -> ConnectorResult:
        ...
