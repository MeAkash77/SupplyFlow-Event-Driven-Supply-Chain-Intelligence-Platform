from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from .config import Settings

_db_engine: AsyncEngine | None = None
_sessionmaker: sessionmaker[AsyncSession] | None = None
_tenant_engines: dict[str, AsyncEngine] = {}
_tenant_sessionmakers: dict[str, sessionmaker[AsyncSession]] = {}


def create_engine(settings: Settings) -> AsyncEngine:
    global _db_engine
    if _db_engine is None:
        _db_engine = create_async_engine(
            settings.neon_database_url,
            echo=settings.environment == "development",
            pool_pre_ping=True,
        )
    return _db_engine


def get_sessionmaker(settings: Settings) -> sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = sessionmaker(
            create_engine(settings),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _sessionmaker


def get_tenant_engine(tenant_db_url: str) -> AsyncEngine:
    engine = _tenant_engines.get(tenant_db_url)
    if engine is None:
        engine = create_async_engine(
            tenant_db_url,
            echo=False,
            pool_pre_ping=True,
        )
        _tenant_engines[tenant_db_url] = engine
    return engine


def get_tenant_sessionmaker(tenant_db_url: str) -> sessionmaker[AsyncSession]:
    sessionmaker_instance = _tenant_sessionmakers.get(tenant_db_url)
    if sessionmaker_instance is None:
        sessionmaker_instance = sessionmaker(
            get_tenant_engine(tenant_db_url),
            class_=AsyncSession,
            expire_on_commit=False,
        )
        _tenant_sessionmakers[tenant_db_url] = sessionmaker_instance
    return sessionmaker_instance


async def create_db_and_tables(settings: Settings) -> None:
    from .models import RegistryBase

    engine = create_engine(settings)
    async with engine.begin() as conn:
        await conn.run_sync(RegistryBase.metadata.create_all)


async def create_tenant_db(tenant_db_url: str) -> None:
    from .models import TenantBase

    engine = get_tenant_engine(tenant_db_url)
    async with engine.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)


def database_summary(settings: Settings) -> dict[str, str]:
    return {
        "provider": "sqlalchemy",
        "dsn_hint": settings.neon_database_url,
    }
