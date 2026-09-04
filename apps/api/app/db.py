from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from .config import Settings

_db_engine: AsyncEngine | None = None
_sessionmaker: sessionmaker[AsyncSession] | None = None
_tenant_engines: dict[str, AsyncEngine] = {}
_tenant_sessionmakers: dict[str, sessionmaker[AsyncSession]] = {}


def _async_database_url(url: str) -> str:
    """
    Convert a standard PostgreSQL URL to an asyncpg URL and
    remove sslmode because asyncpg expects SSL through connect_args.
    """
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # asyncpg does not accept sslmode as a connection keyword.
    if "?" in url:
        base, query = url.split("?", 1)
        params = [
            param
            for param in query.split("&")
            if not param.lower().startswith("sslmode=")
        ]

        url = base
        if params:
            url += "?" + "&".join(params)

    return url


def create_engine(settings: Settings) -> AsyncEngine:
    global _db_engine

    if _db_engine is None:
        database_url = _async_database_url(settings.neon_database_url)

        _db_engine = create_async_engine(
            database_url,
            echo=settings.environment == "development",
            pool_pre_ping=True,
            connect_args={"ssl": "require"},
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
        database_url = _async_database_url(tenant_db_url)

        engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
            connect_args={"ssl": "require"},
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
