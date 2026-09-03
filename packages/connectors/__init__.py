"""Connectors SDK: base interfaces and implementations.
"""
from .base import Connector, ConnectorResult
from .factory import CONNECTOR_CATALOG, create_connector, get_connector_catalog
from .http_adapter import HTTPConnector
from .relex_connector import RelexConnector
from .webhook_connector import WebhookConnector

__all__ = [
    "Connector",
    "ConnectorResult",
    "HTTPConnector",
    "RelexConnector",
    "WebhookConnector",
    "CONNECTOR_CATALOG",
    "create_connector",
    "get_connector_catalog",
]
