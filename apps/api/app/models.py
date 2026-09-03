from __future__ import annotations

from sqlalchemy import JSON, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class RegistryBase(DeclarativeBase):
    pass


class TenantBase(DeclarativeBase):
    pass


class TenantModel(RegistryBase):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    industry: Mapped[str] = mapped_column(String(128), nullable=False)
    headquarters: Mapped[str] = mapped_column(String(128), nullable=False)
    primary_region: Mapped[str] = mapped_column(String(128), nullable=False)
    warehouse_count: Mapped[int] = mapped_column(Integer, nullable=False)
    supplier_count: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_orders: Mapped[int] = mapped_column(Integer, nullable=False)
    flagship_workflow: Mapped[str] = mapped_column(String(128), nullable=False)
    db_url: Mapped[str] = mapped_column(String(256), nullable=False)

    users: Mapped[list["UserModel"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    workflows: Mapped[list["WorkflowRegistryModel"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class UserModel(RegistryBase):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    tenant_id: Mapped[str | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)

    tenant: Mapped[TenantModel | None] = relationship(back_populates="users")


class WorkflowRegistryModel(RegistryBase):
    __tablename__ = "workflow_registry"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str] = mapped_column(String(64), nullable=False)

    tenant: Mapped[TenantModel] = relationship(back_populates="workflows")


class TenantConnector(RegistryBase):
    __tablename__ = "tenant_connectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    connector_type: Mapped[str] = mapped_column(String(64), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by: Mapped[str] = mapped_column(String(64), nullable=False)

    tenant: Mapped[TenantModel] = relationship()


class WorkflowDefinitionModel(TenantBase):
    __tablename__ = "workflow_definitions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str] = mapped_column(String(64), nullable=False)

    nodes: Mapped[list["WorkflowNodeModel"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowNodeModel.id",
    )
    edges: Mapped[list["WorkflowEdgeModel"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowEdgeModel.id",
    )


class WorkflowNodeModel(TenantBase):
    __tablename__ = "workflow_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflow_definitions.id"), nullable=False)
    node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    kind: Mapped[str] = mapped_column(String(64), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)

    workflow: Mapped[WorkflowDefinitionModel] = relationship(back_populates="nodes")


class WorkflowEdgeModel(TenantBase):
    __tablename__ = "workflow_edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflow_definitions.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    target: Mapped[str] = mapped_column(String(64), nullable=False)

    workflow: Mapped[WorkflowDefinitionModel] = relationship(back_populates="edges")
