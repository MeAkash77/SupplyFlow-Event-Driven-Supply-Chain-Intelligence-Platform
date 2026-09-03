"""
Inbound webhook router
======================
ERP systems and n8n workflows POST data here. No custom per-ERP connector
code is needed — the ERP or n8n handles the auth and data fetch, then
sends a normalised event payload to this endpoint.

Endpoint:
  POST /api/webhooks/inbound/{tenant_id}

Headers:
  X-Source        : sap | oracle | dynamics | netsuite | n8n | generic
  X-Webhook-Token : shared secret from the tenant's connector settings

Payload (flexible — just needs at least an "event_type"):
  {
    "event_type": "purchase_order_created" | "stock_updated" | "shipment_dispatched" | ...,
    "source":     "sap" | "oracle" | "dynamics" | "netsuite" | "n8n",
    "tenant_id":  "acme-retail",
    "data":       { ...ERP-specific fields... }
  }
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from .access import Role, UserContext, ensure_tenant_access
from .config import get_settings
from .deps import get_current_actor
from .messaging import RabbitMQEventPublisher

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()
publisher = RabbitMQEventPublisher(settings)

# ── Supported ERP sources ─────────────────────────────────────────────────────

KNOWN_SOURCES = {
    "sap",
    "oracle",
    "dynamics",
    "netsuite",
    "infor",
    "relex",
    "n8n",
    "airbyte",
    "generic",
}

# ── Event type registry (what events EasyFlow understands) ────────────────────

KNOWN_EVENT_TYPES = {
    # Purchase / procurement
    "purchase_order_created",
    "purchase_order_approved",
    "purchase_order_rejected",
    "purchase_order_received",
    # Inventory
    "stock_updated",
    "stock_low_alert",
    "stock_replenishment_needed",
    # Shipments / logistics
    "shipment_dispatched",
    "shipment_delivered",
    "shipment_delayed",
    # Suppliers
    "supplier_confirmed",
    "supplier_rejected",
    "supplier_sla_breach",
    # Generic
    "workflow_trigger",
    "custom_event",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _verify_token(tenant_id: str, token: str | None) -> bool:
    """
    Simple HMAC verification.
    Token = HMAC-SHA256(secret_key, tenant_id).
    In production store per-tenant secrets in the DB.
    """
    if not token:
        return False
    secret = settings.webhook_secret_key.encode()
    expected = hmac.new(secret, tenant_id.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, token)


def _normalise_payload(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Accept flexible ERP payloads and normalise to EasyFlow's internal format.
    n8n is configured to send already-normalised payloads; raw ERP webhooks
    may need mapping — add ERP-specific field maps here over time.
    """
    source = raw.get("source", "generic").lower()
    event_type = raw.get("event_type", "custom_event")
    data = raw.get("data", {})

    # ── SAP field aliases ────────────────────────────────────────────────────
    if source == "sap":
        # SAP PO creation sends PurchaseOrder, not purchase_order_id
        if "PurchaseOrder" in data and "purchase_order_id" not in data:
            data["purchase_order_id"] = data.pop("PurchaseOrder")
        if "OrderQuantity" in data and "quantity" not in data:
            data["quantity"] = data.pop("OrderQuantity")
        if "Supplier" in data and "supplier_name" not in data:
            data["supplier_name"] = data.pop("Supplier")

    # ── Oracle field aliases ─────────────────────────────────────────────────
    elif source == "oracle":
        if "PONumber" in data and "purchase_order_id" not in data:
            data["purchase_order_id"] = data.pop("PONumber")
        if "QuantityOrdered" in data and "quantity" not in data:
            data["quantity"] = data.pop("QuantityOrdered")

    # ── Dynamics 365 field aliases ───────────────────────────────────────────
    elif source == "dynamics":
        if "purchaseorderid" in data and "purchase_order_id" not in data:
            data["purchase_order_id"] = data.pop("purchaseorderid")

    return {
        "source": source,
        "event_type": event_type if event_type in KNOWN_EVENT_TYPES else "custom_event",
        "original_event_type": event_type,
        "data": data,
        "received_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/api/webhooks/inbound/{tenant_id}", status_code=status.HTTP_202_ACCEPTED)
async def inbound_webhook(
    tenant_id: str,
    request: Request,
    x_source: str | None = Header(default=None),
    x_webhook_token: str | None = Header(default=None),
) -> dict[str, Any]:
    """
    Receives events from any ERP system or n8n workflow.

    n8n workflow setup:
      1. Add an HTTP Request node in n8n
      2. Method: POST
      3. URL: http://your-api:8000/api/webhooks/inbound/{tenant_id}
      4. Header: X-Webhook-Token = <token from EasyFlow settings>
      5. Header: X-Source = sap | oracle | dynamics | n8n
      6. Body: JSON with event_type + data fields
    """

    # ── Auth ─────────────────────────────────────────────────────────────────
    # In development, skip token check if no secret is configured
    if settings.webhook_secret_key != "change-me-in-production":
        if not _verify_token(tenant_id, x_webhook_token):
            logger.warning("Webhook auth failed for tenant %s source=%s", tenant_id, x_source)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing webhook token.",
            )

    # ── Parse body ────────────────────────────────────────────────────────────
    try:
        raw = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must be valid JSON.",
        )

    # Inject source from header if not in body
    if x_source and "source" not in raw:
        raw["source"] = x_source.lower()

    # ── Normalise ─────────────────────────────────────────────────────────────
    event = _normalise_payload(raw)
    event["tenant_id"] = tenant_id

    # ── Log and return ────────────────────────────────────────────────────────
    logger.info(
        "Webhook received | tenant=%s source=%s event=%s",
        tenant_id,
        event["source"],
        event["event_type"],
    )

    try:
        message = publisher.build_workflow_transition_message(
            f"webhook.{event['source']}.{event['event_type']}",
            event,
        )
        await publisher.publish(message)
    except Exception as exc:
        logger.exception(
            "Webhook publish failed | tenant=%s source=%s event=%s",
            tenant_id,
            event["source"],
            event["event_type"],
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook accepted but could not be queued for processing.",
        ) from exc

    return {
        "accepted": True,
        "tenant_id": tenant_id,
        "event_type": event["event_type"],
        "source": event["source"],
        "received_at": event["received_at"],
    }


@router.get("/api/webhooks/token/{tenant_id}")
async def get_webhook_token(
    tenant_id: str,
    actor: UserContext = Depends(get_current_actor),
) -> dict[str, str]:
    """
    Returns the webhook token for a tenant.
    In production this should be protected behind superadmin auth.
    """
    ensure_tenant_access(actor, tenant_id)
    if actor.role not in {Role.SUPERADMIN, Role.TENANT_ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can issue webhook tokens.",
        )

    secret = settings.webhook_secret_key.encode()
    token = hmac.new(secret, tenant_id.encode(), hashlib.sha256).hexdigest()
    return {
        "tenant_id": tenant_id,
        "token": token,
        "endpoint": f"/api/webhooks/inbound/{tenant_id}",
        "n8n_header": "X-Webhook-Token",
    }


@router.get("/api/webhooks/events")
async def list_event_types(
    actor: UserContext = Depends(get_current_actor),
) -> dict[str, Any]:
    """Returns all event types EasyFlow understands."""
    return {
        "event_types": sorted(KNOWN_EVENT_TYPES),
        "sources": sorted(KNOWN_SOURCES),
    }
