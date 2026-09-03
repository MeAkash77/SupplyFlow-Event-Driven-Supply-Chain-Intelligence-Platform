from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Role(StrEnum):
    SUPERADMIN = "superadmin"
    TENANT_ADMIN = "tenant_admin"
    ANALYST = "analyst"


@dataclass(slots=True)
class UserContext:
    id: str
    email: str
    role: Role
    tenant_id: str | None
    display_name: str


class AuthorizationError(PermissionError):
    pass


def can_access_tenant(actor: UserContext, tenant_id: str) -> bool:
    if actor.role == Role.SUPERADMIN:
        return True
    return actor.tenant_id == tenant_id


def ensure_tenant_access(actor: UserContext, tenant_id: str) -> None:
    if not can_access_tenant(actor, tenant_id):
        raise AuthorizationError(
            f"User '{actor.id}' cannot access tenant '{tenant_id}'."
        )


def visible_tenant_ids(actor: UserContext, known_tenant_ids: list[str]) -> list[str]:
    if actor.role == Role.SUPERADMIN:
        return known_tenant_ids
    if actor.tenant_id is None:
        return []
    return [tenant_id for tenant_id in known_tenant_ids if tenant_id == actor.tenant_id]
