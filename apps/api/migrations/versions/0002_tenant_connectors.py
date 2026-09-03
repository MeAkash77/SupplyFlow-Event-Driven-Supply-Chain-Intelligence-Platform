"""create tenant_connectors table

Revision ID: 0002_tenant_connectors
Revises: 0001_initial
Create Date: 2026-05-31 00:00:00.000001
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_tenant_connectors'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tenant_connectors',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('connector_type', sa.String(length=64), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.String(length=64), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('tenant_connectors')
