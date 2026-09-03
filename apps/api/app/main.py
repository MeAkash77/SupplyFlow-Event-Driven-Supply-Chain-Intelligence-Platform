from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from .access import AuthorizationError, Role, UserContext
from .config import get_settings
from .db import create_db_and_tables, database_summary, get_sessionmaker
from .deps import get_current_actor, get_session
from .messaging import RabbitMQEventPublisher, messaging_summary
from .notifications import NotificationService
from .store import store
from . import connectors as connectors_module
from . import webhooks as webhooks_module

settings = get_settings()

notification_service = NotificationService(RabbitMQEventPublisher(settings))

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Workflow-centric supply chain SaaS API scaffold with database persistence.",
)

# include connectors router
app.include_router(connectors_module.router)

# include inbound webhook router (receives events from ERPs and n8n)
app.include_router(webhooks_module.router)


class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    industry: str
    headquarters: str
    primary_region: str
    warehouse_count: int
    supplier_count: int
    monthly_orders: int
    flagship_workflow: str


class NotificationRequest(BaseModel):
    tenant_id: str
    level: str
    title: str
    message: str
    details: dict[str, object] | None = None


@app.on_event("startup")
async def startup() -> None:
    await create_db_and_tables(settings)
    async_session = get_sessionmaker(settings)
    async with async_session() as session:
        await store.bootstrap(session)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "database": database_summary(settings),
        "messaging": messaging_summary(settings),
    }


@app.post("/api/tenants")
async def create_tenant(
    request: CreateTenantRequest,
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    if actor.role != Role.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can create tenants.",
        )

    try:
        tenant = await store.create_tenant(request.model_dump(), session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"item": tenant, "actor": {"id": actor.id, "role": actor.role}}


@app.post("/api/notifications/ping")
async def ping_notifications(
    actor: UserContext = Depends(get_current_actor),
) -> dict[str, object]:
    ping_result = await notification_service.send_ping(actor)
    return {"item": ping_result, "actor": {"id": actor.id, "role": actor.role}}


@app.post("/api/notifications/alerts")
async def send_alert(
    request: NotificationRequest,
    actor: UserContext = Depends(get_current_actor),
) -> dict[str, object]:
    try:
        alert_result = await notification_service.publish_alert(request.model_dump(), actor)
    except AuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return {"item": alert_result, "actor": {"id": actor.id, "role": actor.role}}


@app.get("/api/tenants")
async def list_tenants(
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return {"items": await store.list_tenants(actor, session), "actor": {"id": actor.id, "role": actor.role}}


@app.get("/api/users")
async def list_users(
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return {"items": await store.list_users(actor, session), "actor": {"id": actor.id, "role": actor.role}}


@app.get("/api/workflows")
async def list_workflows(
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return {
        "items": await store.list_workflow_definitions(actor, session),
        "actor": {"id": actor.id, "role": actor.role},
    }


@app.get("/api/workflows/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict:
    try:
        return await store.get_workflow_definition(workflow_id, actor, session)
    except AuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@app.post("/api/workflows/{workflow_id}/simulate")
async def simulate_workflow(
    workflow_id: str,
    payload: dict | None = None,
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict:
    try:
        return await store.simulate_workflow(workflow_id, actor, session, payload=payload)
    except AuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@app.get("/api/system/stack")
def get_stack() -> dict[str, object]:
    return {
        "database": database_summary(settings),
        "messaging": messaging_summary(settings),
        "ui": {
            "framework": "nextjs",
            "styling": "tailwindcss",
            "component_system": "shadcn",
        },
    }


@app.get("/api/system/access-model")
async def get_access_model(
    actor: UserContext = Depends(get_current_actor),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return {
        "roles": {
            "superadmin": "Can view and control workflows across all tenants.",
            "tenant_admin": "Can fully control users and workflows inside their own tenant only.",
            "analyst": "Can view only tenant-scoped records assigned to their own tenant.",
        },
        "rule": "Tenant admins are tenant-scoped. Cross-tenant workflow control is superadmin-only.",
        "seeded_actors": [user["id"] for user in await store.list_users(actor, session)],
    }
