from __future__ import annotations

from typing import Any, Dict

from .base import Connector
from .http_adapter import HTTPConnector
from .relex_connector import RelexConnector
from .webhook_connector import WebhookConnector

# ── Connector catalog ─────────────────────────────────────────────────────────
#
# ALL connectors now use the webhook/n8n pattern:
#   ERP → n8n workflow → POST /api/webhooks/inbound/{tenant_id}
#
# This means:
#  • No per-ERP auth complexity in EasyFlow
#  • n8n handles SAP OAuth, Oracle certs, Dynamics tokens etc.
#  • EasyFlow just receives clean, normalised events
#  • Fully open-source, zero paid services
#
# The WebhookConnector below is a lightweight client used when EasyFlow
# needs to PUSH events back to n8n or an external system.

CONNECTOR_CATALOG = {
    # ── n8n (recommended) ─────────────────────────────────────────────────
    "n8n": {
        "label": "n8n Workflow Automation",
        "description": (
            "Connect any ERP (SAP, Oracle, Dynamics, NetSuite) through n8n's "
            "visual workflow builder. n8n fetches data from your ERP and forwards "
            "it to EasyFlow via webhook. Self-hosted, open-source, zero cost."
        ),
        "fields": ["n8n_base_url", "webhook_token"],
        "how_it_works": "pull_via_n8n",
        "docs": "/docs/connect-erp",
    },

    # ── Direct webhook (any system) ───────────────────────────────────────
    "webhook": {
        "label": "Inbound Webhook",
        "description": (
            "Any ERP, WMS, or script can POST events directly to EasyFlow. "
            "Configure your ERP to send a POST request when a PO is created, "
            "stock changes, or a shipment is dispatched. No middleware needed."
        ),
        "fields": ["webhook_token"],
        "how_it_works": "push_from_erp",
        "docs": "/docs/connect-erp",
    },

    # ── SAP (via n8n) ─────────────────────────────────────────────────────
    "sap": {
        "label": "SAP S/4HANA",
        "description": (
            "Connect SAP S/4HANA via n8n. n8n uses SAP's OData APIs to fetch "
            "purchase orders, stock levels, and goods receipts, then forwards "
            "them to EasyFlow automatically on a schedule or trigger."
        ),
        "fields": ["n8n_base_url", "webhook_token"],
        "how_it_works": "pull_via_n8n",
        "n8n_template": "sap-to-easyflow",
        "docs": "/docs/connect-erp",
    },

    # ── Oracle (via n8n) ──────────────────────────────────────────────────
    "oracle": {
        "label": "Oracle ERP Cloud",
        "description": (
            "Connect Oracle ERP Cloud via n8n. n8n authenticates with Oracle's "
            "REST APIs and syncs purchase orders and inventory data to EasyFlow."
        ),
        "fields": ["n8n_base_url", "webhook_token"],
        "how_it_works": "pull_via_n8n",
        "n8n_template": "oracle-to-easyflow",
        "docs": "/docs/connect-erp",
    },

    # ── Microsoft Dynamics 365 (via n8n) ──────────────────────────────────
    "dynamics": {
        "label": "Microsoft Dynamics 365",
        "description": (
            "Connect Dynamics 365 via n8n. n8n handles Microsoft OAuth2 and "
            "pulls orders, inventory, and supplier data into EasyFlow."
        ),
        "fields": ["n8n_base_url", "webhook_token"],
        "how_it_works": "pull_via_n8n",
        "n8n_template": "dynamics-to-easyflow",
        "docs": "/docs/connect-erp",
    },

    # ── NetSuite (via n8n) ────────────────────────────────────────────────
    "netsuite": {
        "label": "NetSuite",
        "description": (
            "Connect NetSuite via n8n. n8n uses NetSuite's REST API or SuiteQL "
            "to sync inventory items, purchase orders, and vendor records."
        ),
        "fields": ["n8n_base_url", "webhook_token"],
        "how_it_works": "pull_via_n8n",
        "n8n_template": "netsuite-to-easyflow",
        "docs": "/docs/connect-erp",
    },

    # ── Generic HTTP (direct or via n8n) ──────────────────────────────────
    "generic_http": {
        "label": "Generic HTTP / REST",
        "description": (
            "Connect any REST API directly. Use this for custom WMS, home-built "
            "inventory systems, or any tool that can send HTTP requests."
        ),
        "fields": ["base_url", "api_key", "headers"],
        "how_it_works": "direct_http",
        "docs": "/docs/connect-erp",
    },

    # ── Relex (direct REST) ───────────────────────────────────────────────
    "relex": {
        "label": "Relex Solutions",
        "description": (
            "Direct REST connector for Relex demand planning APIs. "
            "Fetches forecast data, replenishment signals, and stock projections."
        ),
        "fields": ["base_url", "api_key"],
        "how_it_works": "direct_http",
        "docs": "/docs/connect-erp",
    },
}


def get_connector_catalog() -> dict[str, dict[str, Any]]:
    return CONNECTOR_CATALOG


def create_connector(connector_type: str, config: dict[str, Any]) -> Connector:
    normalized = connector_type.lower()

    # n8n / webhook connectors — EasyFlow is the receiver, not the caller.
    # We instantiate a WebhookConnector that can ping n8n's health endpoint
    # and verify the integration is live.
    if normalized in {"n8n", "webhook", "sap", "oracle", "dynamics", "netsuite"}:
        n8n_url = config.get("n8n_base_url", "http://localhost:5678")
        token = config.get("webhook_token", "")
        return WebhookConnector(n8n_base_url=n8n_url, webhook_token=token, source=normalized)

    if normalized == "relex":
        return RelexConnector(
            base_url=config["base_url"],
            api_key=config.get("api_key", ""),
        )

    if normalized == "generic_http":
        headers: dict[str, str] = {}
        api_key = config.get("api_key")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        if isinstance(config.get("headers"), dict):
            headers.update(config["headers"])
        return HTTPConnector(base_url=config["base_url"], headers=headers)

    raise ValueError(f"Unsupported connector type: {connector_type}")
