from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ensure repo root is on path
HERE = os.path.dirname(__file__)
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import the app settings and models
try:
    from apps.api.app.config import get_settings
    from apps.api.app import models as models
except Exception:  # pragma: no cover - defensive
    # Fallback: try alternative import path
    from app.config import get_settings
    from app import models

# Use registry DB URL from settings
settings = get_settings()
database_url = settings.neon_database_url
config.set_main_option("sqlalchemy.url", database_url)

target_metadata = models.RegistryBase.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
