from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .access import UserContext
from .config import Settings, get_settings
from .db import get_sessionmaker
from .store import store


async def get_session(settings: Settings = Depends(get_settings)) -> AsyncSession:
    sessionmaker = get_sessionmaker(settings)
    async with sessionmaker() as session:
        yield session


async def get_current_actor(
    x_actor_id: str = Header(..., alias="X-Actor-Id"),
    session: AsyncSession = Depends(get_session),
) -> UserContext:
    actor = await store.get_actor(x_actor_id, session)
    if actor is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown actor '{x_actor_id}'.",
        )
    return actor
