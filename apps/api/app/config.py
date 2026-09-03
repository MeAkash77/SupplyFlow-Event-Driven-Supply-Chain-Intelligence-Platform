from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EasyFlow API"
    environment: str = "development"

    neon_database_url: str = Field(
        default="sqlite+aiosqlite:///./easyflow-registry.db",
        description="Central registry database connection string. Use a Neon/asyncpg URL in production.",
    )
    tenant_db_dir: str = Field(
        default="./data",
        description="Directory where per-tenant database files are created for local development.",
    )
    rabbitmq_url: str = Field(
        default="amqp://guest:guest@localhost:5672/",
        description="RabbitMQ connection string.",
    )
    rabbitmq_exchange: str = "easyflow.events"
    rabbitmq_routing_prefix: str = "workflow"

    # Webhook auth — generate with: openssl rand -hex 32
    webhook_secret_key: str = Field(
        default="change-me-in-production",
        description="HMAC secret used to verify inbound webhook tokens.",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
