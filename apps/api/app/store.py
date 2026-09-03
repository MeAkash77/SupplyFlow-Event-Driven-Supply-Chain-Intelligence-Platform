from __future__ import annotations

from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from packages.engine.easyflow_engine import WorkflowEngine, load_workflow_definition
from packages.engine.easyflow_engine.models import WorkflowDefinition, WorkflowEdge, WorkflowNode

from .access import AuthorizationError, Role, UserContext, ensure_tenant_access
from .config import Settings
from .db import create_tenant_db, get_tenant_sessionmaker
from .messaging import RabbitMQEventPublisher
from .models import (
    TenantModel,
    UserModel,
    WorkflowRegistryModel,
    WorkflowDefinitionModel,
    WorkflowEdgeModel,
    WorkflowNodeModel,
)


class EasyFlowStore:
    settings: Settings

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.engine = WorkflowEngine()
        self.publisher = RabbitMQEventPublisher(settings)
        self._seed_path = Path(__file__).resolve().parents[3] / "examples" / "procurement_workflow.json"

    async def bootstrap(self, session: AsyncSession) -> None:
        tenant_count = await session.scalar(select(func.count()).select_from(TenantModel))
        if tenant_count and tenant_count > 0:
            return

        tenant_dir = Path(self.settings.tenant_db_dir)
        tenant_dir.mkdir(parents=True, exist_ok=True)

        base_definition = load_workflow_definition(self._seed_path)
        tenants = self._seed_tenants(tenant_dir)
        users = self._seed_users()
        workflow_registry = self._seed_workflow_registry()

        session.add_all(tenants)
        session.add_all(users)
        session.add_all(workflow_registry)
        await session.commit()

        for tenant in tenants:
            await create_tenant_db(tenant.db_url)
            tenant_workflows = [w for w in workflow_registry if w.tenant_id == tenant.id]
            await self._seed_tenant_workflows(tenant.id, tenant.db_url, base_definition, tenant_workflows)

    async def create_tenant(
        self,
        tenant_data: dict,
        session: AsyncSession,
    ) -> dict:
        tenant_id = tenant_data.get("id") or f"tenant-{tenant_data['slug']}"
        existing = await session.scalar(select(TenantModel).where(TenantModel.id == tenant_id))
        if existing is not None:
            raise ValueError(f"Tenant '{tenant_id}' already exists.")

        if await session.scalar(select(func.count()).select_from(TenantModel).where(TenantModel.slug == tenant_data["slug"])):
            raise ValueError(f"Tenant slug '{tenant_data['slug']}' already exists.")

        tenant_dir = Path(self.settings.tenant_db_dir)
        tenant_dir.mkdir(parents=True, exist_ok=True)
        tenant_db_url = f"sqlite+aiosqlite:///{tenant_dir / f'{tenant_id}.db'}"

        await create_tenant_db(tenant_db_url)

        tenant = TenantModel(
            id=tenant_id,
            name=tenant_data["name"],
            slug=tenant_data["slug"],
            industry=tenant_data["industry"],
            headquarters=tenant_data["headquarters"],
            primary_region=tenant_data["primary_region"],
            warehouse_count=tenant_data["warehouse_count"],
            supplier_count=tenant_data["supplier_count"],
            monthly_orders=tenant_data["monthly_orders"],
            flagship_workflow=tenant_data["flagship_workflow"],
            db_url=tenant_db_url,
        )

        async with session.begin():
            session.add(tenant)

        await create_tenant_db(tenant_db_url)

        base_definition = load_workflow_definition(self._seed_path)
        registry_workflow = WorkflowRegistryModel(
            id=f"wf-{tenant.id}-default",
            tenant_id=tenant.id,
            name=f"{tenant.name} Starter Workflow",
            description="Default starter workflow for the new tenant.",
            created_by="superadmin",
        )
        async with session.begin():
            session.add(registry_workflow)

        await self._seed_tenant_workflows(tenant.id, tenant_db_url, base_definition, [registry_workflow])

        return self._tenant_to_dict(tenant)

    async def get_actor(self, actor_id: str, session: AsyncSession) -> UserContext | None:
        result = await session.execute(select(UserModel).where(UserModel.id == actor_id))
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return self._actor_from_model(model)

    async def list_tenants(self, actor: UserContext, session: AsyncSession) -> list[dict]:
        if actor.role == Role.SUPERADMIN:
            stmt = select(TenantModel)
        else:
            stmt = select(TenantModel).where(TenantModel.id == actor.tenant_id)

        result = await session.execute(stmt)
        return [self._tenant_to_dict(item) for item in result.scalars().all()]

    async def list_users(self, actor: UserContext, session: AsyncSession) -> list[dict]:
        if actor.role == Role.SUPERADMIN:
            stmt = select(UserModel)
        else:
            stmt = select(UserModel).where(UserModel.tenant_id == actor.tenant_id)

        result = await session.execute(stmt)
        return [self._serialize_actor(model) for model in result.scalars().all()]

    async def list_workflow_definitions(self, actor: UserContext, session: AsyncSession) -> list[dict]:
        stmt = select(WorkflowRegistryModel)
        if actor.role != Role.SUPERADMIN:
            stmt = stmt.where(WorkflowRegistryModel.tenant_id == actor.tenant_id)

        result = await session.execute(stmt)
        workflows = result.scalars().all()

        return [
            await self._load_workflow_response(workflow_model, session)
            for workflow_model in workflows
        ]

    async def get_workflow_definition(
        self,
        workflow_id: str,
        actor: UserContext,
        session: AsyncSession,
    ) -> dict:
        workflow_registry = await self._require_workflow_registry(workflow_id, session)
        ensure_tenant_access(actor, workflow_registry.tenant_id)
        return await self._load_workflow_response(workflow_registry, session)

    async def simulate_workflow(
        self,
        workflow_id: str,
        actor: UserContext,
        session: AsyncSession,
        payload: dict | None = None,
    ) -> dict:
        workflow_registry = await self._require_workflow_registry(workflow_id, session)
        ensure_tenant_access(actor, workflow_registry.tenant_id)

        workflow_model = await self._load_tenant_workflow(workflow_registry.id, workflow_registry.tenant_id, session)
        definition = self._definition_from_model(workflow_model, workflow_registry.tenant_id)
        execution = self.engine.simulate_all(definition, payload=payload)
        execution_data = self.engine.describe_execution(execution)
        execution_message = self.publisher.build_workflow_transition_message(
            "execution.completed",
            {
                "tenant_id": execution.tenant_id,
                "workflow_id": execution.workflow_id,
                "visited_nodes": execution.visited_nodes,
                "completed": execution.completed,
                "triggered_by": actor.id,
            },
        )
        await self.publisher.publish(execution_message)

        if len(execution.visited_nodes) >= 5:
            alert_payload = {
                "tenant_id": execution.tenant_id,
                "workflow_id": execution.workflow_id,
                "severity": "warning",
                "title": "Long-running workflow",
                "detail": (
                    f"Workflow '{workflow_registry.name}' executed {len(execution.visited_nodes)} steps "
                    "and completed successfully."
                ),
                "visited_nodes": execution.visited_nodes,
            }
            notification_message = self.publisher.build_notification_message(
                "workflow.long_running",
                alert_payload,
            )
            await self.publisher.publish(notification_message)

        return {
            "execution": execution_data,
            "stream_event": {
                "exchange": execution_message.exchange,
                "routing_key": execution_message.routing_key,
                "payload": execution_message.payload,
            },
            "access_scope": {
                "actor_id": actor.id,
                "actor_role": actor.role,
                "tenant_id": workflow_registry.tenant_id,
            },
        }


    async def _require_workflow_registry(
        self,
        workflow_id: str,
        session: AsyncSession,
    ) -> WorkflowRegistryModel:
        result = await session.execute(
            select(WorkflowRegistryModel).where(WorkflowRegistryModel.id == workflow_id)
        )
        model = result.scalar_one_or_none()
        if model is None:
            raise KeyError(f"Unknown workflow '{workflow_id}'.")
        return model

    async def _load_workflow_response(
        self,
        workflow_registry: WorkflowRegistryModel,
        session: AsyncSession,
    ) -> dict:
        workflow_model = await self._load_tenant_workflow(
            workflow_registry.id, workflow_registry.tenant_id, session
        )
        response = self._serialize_workflow_model(workflow_model)
        response["tenant_id"] = workflow_registry.tenant_id
        response["created_by"] = workflow_registry.created_by
        return response

    async def _load_tenant_workflow(
        self,
        workflow_id: str,
        tenant_id: str,
        session: AsyncSession,
    ) -> WorkflowDefinitionModel:
        tenant_db_url = await self._get_tenant_db_url(tenant_id, session)
        tenant_sessionmaker = get_tenant_sessionmaker(tenant_db_url)
        async with tenant_sessionmaker() as tenant_session:
            result = await tenant_session.execute(
                select(WorkflowDefinitionModel)
                .options(joinedload(WorkflowDefinitionModel.nodes), joinedload(WorkflowDefinitionModel.edges))
                .where(WorkflowDefinitionModel.id == workflow_id)
            )
            model = result.scalar_one_or_none()
            if model is None:
                raise KeyError(f"Unknown workflow '{workflow_id}' for tenant '{tenant_id}'.")
            return model

    async def _get_tenant_db_url(self, tenant_id: str, session: AsyncSession) -> str:
        result = await session.execute(select(TenantModel).where(TenantModel.id == tenant_id))
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise KeyError(f"Unknown tenant '{tenant_id}'.")
        return tenant.db_url

    def _tenant_to_dict(self, tenant: TenantModel) -> dict:
        return {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "industry": tenant.industry,
            "headquarters": tenant.headquarters,
            "primary_region": tenant.primary_region,
            "warehouse_count": tenant.warehouse_count,
            "supplier_count": tenant.supplier_count,
            "monthly_orders": tenant.monthly_orders,
            "flagship_workflow": tenant.flagship_workflow,
            "db_url": tenant.db_url,
        }

    def _serialize_actor(self, user: UserModel) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "role": Role(user.role),
            "tenant_id": user.tenant_id,
            "display_name": user.display_name,
        }

    def _actor_from_model(self, user: UserModel) -> UserContext:
        return UserContext(
            id=user.id,
            email=user.email,
            role=Role(user.role),
            tenant_id=user.tenant_id,
            display_name=user.display_name,
        )

    def _serialize_workflow_model(self, model: WorkflowDefinitionModel) -> dict:
        return {
            "id": model.id,
            "name": model.name,
            "description": model.description,
            "nodes": [
                {
                    "id": node.node_id,
                    "name": node.name,
                    "kind": node.kind,
                    "config": node.config,
                }
                for node in model.nodes
            ],
            "edges": [
                {"source": edge.source, "target": edge.target} for edge in model.edges
            ],
            "created_by": model.created_by,
        }

    def _definition_from_model(self, model: WorkflowDefinitionModel, tenant_id: str) -> WorkflowDefinition:
        return WorkflowDefinition(
            id=model.id,
            tenant_id=tenant_id,
            name=model.name,
            description=model.description,
            nodes=[
                WorkflowNode(
                    id=node.node_id,
                    name=node.name,
                    kind=node.kind,
                    config=node.config,
                )
                for node in model.nodes
            ],
            edges=[WorkflowEdge(source=edge.source, target=edge.target) for edge in model.edges],
        )

    def _seed_tenants(self, tenant_dir: Path) -> list[TenantModel]:
        return [
            TenantModel(
                id="tenant-acme",
                name="Acme Retail",
                slug="acme-retail",
                industry="Retail",
                headquarters="Chicago, IL",
                primary_region="Midwest United States",
                warehouse_count=8,
                supplier_count=42,
                monthly_orders=1280,
                flagship_workflow="Seasonal Replenishment",
                db_url=f"sqlite+aiosqlite:///{tenant_dir / 'tenant-acme.db'}",
            ),
            TenantModel(
                id="tenant-nova",
                name="Nova Manufacturing",
                slug="nova-manufacturing",
                industry="Manufacturing",
                headquarters="Detroit, MI",
                primary_region="Great Lakes",
                warehouse_count=5,
                supplier_count=76,
                monthly_orders=940,
                flagship_workflow="Plant Replenishment",
                db_url=f"sqlite+aiosqlite:///{tenant_dir / 'tenant-nova.db'}",
            ),
            TenantModel(
                id="tenant-blueharbor",
                name="BlueHarbor Foods",
                slug="blueharbor-foods",
                industry="Food Distribution",
                headquarters="Jacksonville, FL",
                primary_region="Southeast United States",
                warehouse_count=6,
                supplier_count=58,
                monthly_orders=1710,
                flagship_workflow="Cold Chain Dispatch",
                db_url=f"sqlite+aiosqlite:///{tenant_dir / 'tenant-blueharbor.db'}",
            ),
            TenantModel(
                id="tenant-northstar",
                name="Northstar Medical Supply",
                slug="northstar-medical-supply",
                industry="Medical Supply",
                headquarters="Minneapolis, MN",
                primary_region="North Central",
                warehouse_count=4,
                supplier_count=33,
                monthly_orders=620,
                flagship_workflow="Hospital Restock Approval",
                db_url=f"sqlite+aiosqlite:///{tenant_dir / 'tenant-northstar.db'}",
            ),
            TenantModel(
                id="tenant-solstice",
                name="Solstice Consumer Electronics",
                slug="solstice-electronics",
                industry="Consumer Electronics",
                headquarters="Austin, TX",
                primary_region="Southwest United States",
                warehouse_count=7,
                supplier_count=65,
                monthly_orders=1495,
                flagship_workflow="Launch Allocation Flow",
                db_url=f"sqlite+aiosqlite:///{tenant_dir / 'tenant-solstice.db'}",
            ),
        ]

    def _seed_users(self) -> list[UserModel]:
        return [
            UserModel(
                id="superadmin-1",
                email="platform-admin@easyflow.dev",
                role=Role.SUPERADMIN,
                tenant_id=None,
                display_name="Platform Superadmin",
            ),
            UserModel(
                id="tenant-admin-acme",
                email="admin@acme-retail.com",
                role=Role.TENANT_ADMIN,
                tenant_id="tenant-acme",
                display_name="Acme Admin",
            ),
            UserModel(
                id="tenant-admin-nova",
                email="admin@nova-manufacturing.com",
                role=Role.TENANT_ADMIN,
                tenant_id="tenant-nova",
                display_name="Nova Admin",
            ),
            UserModel(
                id="analyst-acme",
                email="analyst@acme-retail.com",
                role=Role.ANALYST,
                tenant_id="tenant-acme",
                display_name="Acme Analyst",
            ),
            UserModel(
                id="tenant-admin-blueharbor",
                email="ops@blueharborfoods.com",
                role=Role.TENANT_ADMIN,
                tenant_id="tenant-blueharbor",
                display_name="BlueHarbor Ops Admin",
            ),
            UserModel(
                id="tenant-admin-northstar",
                email="admin@northstarmedical.com",
                role=Role.TENANT_ADMIN,
                tenant_id="tenant-northstar",
                display_name="Northstar Admin",
            ),
            UserModel(
                id="tenant-admin-solstice",
                email="admin@solstice-electronics.com",
                role=Role.TENANT_ADMIN,
                tenant_id="tenant-solstice",
                display_name="Solstice Admin",
            ),
        ]

    def _seed_workflow_registry(self) -> list[WorkflowRegistryModel]:
        return [
            WorkflowRegistryModel(
                id="wf-acme-seasonal-replenishment",
                tenant_id="tenant-acme",
                name="Acme Seasonal Replenishment",
                description="Retail replenishment flow for fast-moving seasonal SKUs.",
                created_by="tenant-admin-acme",
            ),
            WorkflowRegistryModel(
                id="wf-nova-replenishment",
                tenant_id="tenant-nova",
                name="Nova Replenishment Flow",
                description="Manufacturing replenishment flow for plant stock recovery.",
                created_by="tenant-admin-nova",
            ),
            WorkflowRegistryModel(
                id="wf-blueharbor-cold-chain",
                tenant_id="tenant-blueharbor",
                name="BlueHarbor Cold Chain Dispatch",
                description="Temperature-sensitive dispatch flow for regional grocery distribution.",
                created_by="tenant-admin-blueharbor",
            ),
            WorkflowRegistryModel(
                id="wf-northstar-hospital-restock",
                tenant_id="tenant-northstar",
                name="Northstar Hospital Restock",
                description="Regulated medical restock workflow for urgent care and hospital fulfillment.",
                created_by="tenant-admin-northstar",
            ),
            WorkflowRegistryModel(
                id="wf-solstice-launch-allocation",
                tenant_id="tenant-solstice",
                name="Solstice Launch Allocation",
                description="Channel allocation and dispatch workflow for new hardware launches.",
                created_by="tenant-admin-solstice",
            ),
        ]

    async def _seed_tenant_workflows(self, tenant_id: str, tenant_db_url: str) -> None:
        base_definition = load_workflow_definition(self._seed_path)
        workflow_models = [
            self._build_tenant_workflow_model(
                base_definition,
                workflow_id=f"wf-{tenant_id}-workflow",
                name=f"{tenant_id} Workflow",
                description=f"Auto-seeded workflow for {tenant_id}.",
                created_by=f"tenant-admin-{tenant_id.split('-')[-1]}",
            )
        ]

        sessionmaker = get_tenant_sessionmaker(tenant_db_url)
        async with sessionmaker() as tenant_session:
            tenant_session.add_all(workflow_models)
            await tenant_session.commit()

    def _build_tenant_workflow_model(
        self,
        base_definition: WorkflowDefinition,
        workflow_id: str,
        name: str,
        description: str,
        created_by: str,
    ) -> WorkflowDefinitionModel:
        workflow = WorkflowDefinitionModel(
            id=workflow_id,
            name=name,
            description=description,
            created_by=created_by,
        )
        workflow.nodes = [
            WorkflowNodeModel(
                node_id=node.id,
                name=node.name,
                kind=node.kind,
                config=node.config,
            )
            for node in base_definition.nodes
        ]
        workflow.edges = [WorkflowEdgeModel(source=edge.source, target=edge.target) for edge in base_definition.edges]
        return workflow


store = EasyFlowStore(settings=Settings())
