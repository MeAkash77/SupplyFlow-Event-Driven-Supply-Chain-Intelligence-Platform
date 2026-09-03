from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .access import AuthorizationError, Role, ensure_tenant_access, UserContext
from .deps import get_current_actor, get_session
from .models import TenantConnector, TenantModel
from packages.connectors import create_connector, get_connector_catalog

router = APIRouter()


@router.get("/api/connectors")
async def list_connectors() -> dict[str, Any]:
    catalog = get_connector_catalog()
    return {"connectors": [{"type": key, **value} for key, value in catalog.items()]}


@router.get("/api/tenants/{tenant_id}/connectors")
async def list_tenant_connectors(
    tenant_id: str,
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    ensure_tenant_access(actor, tenant_id)

    query = await session.execute(select(TenantConnector).where(TenantConnector.tenant_id == tenant_id))
    connectors = [
        {
            "id": row.id,
            "tenant_id": row.tenant_id,
            "connector_type": row.connector_type,
            "config": row.config,
            "created_by": row.created_by,
        }
        for row in query.scalars().all()
    ]
    return {"items": connectors}


@router.post("/api/tenants/{tenant_id}/connectors")
async def register_connector(
    tenant_id: str,
    payload: dict[str, Any],
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    if actor.role != Role.SUPERADMIN and actor.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    t = await session.get(TenantModel, tenant_id)
    if t is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    connector_type = payload.get("connector_type")
    if connector_type not in get_connector_catalog():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported connector type")

    conn = TenantConnector(
        tenant_id=tenant_id,
        connector_type=connector_type,
        config=payload.get("config", {}),
        created_by=actor.id,
    )
    session.add(conn)
    await session.commit()
    await session.refresh(conn)
    return {"item": {"id": conn.id, "tenant_id": conn.tenant_id, "connector_type": conn.connector_type, "config": conn.config}}


@router.patch("/api/tenants/{tenant_id}/connectors/{connector_id}")
async def update_connector(
    tenant_id: str,
    connector_id: int,
    payload: dict[str, Any],
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    row = await session.get(TenantConnector, connector_id)
    if row is None or row.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connector not found")
    ensure_tenant_access(actor, tenant_id)

    if "config" in payload:
        row.config = payload["config"]
    if "connector_type" in payload:
        if payload["connector_type"] not in get_connector_catalog():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported connector type")
        row.connector_type = payload["connector_type"]

    session.add(row)
    await session.commit()
    await session.refresh(row)
    return {"item": {"id": row.id, "tenant_id": row.tenant_id, "connector_type": row.connector_type, "config": row.config}}


@router.post("/api/tenants/{tenant_id}/connectors/{connector_id}/test")
async def test_connector(
    tenant_id: str,
    connector_id: int,
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    row = await session.get(TenantConnector, connector_id)
    if row is None or row.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connector not found")

    ensure_tenant_access(actor, tenant_id)

    try:
        connector = create_connector(row.connector_type, row.config)
        result = await connector.test_connection()
        return {"result": result.details, "success": result.success}
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except AuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except Exception as exc:
        return {"result": {"error": str(exc)}, "success": False}
