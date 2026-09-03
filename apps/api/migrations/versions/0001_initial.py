"""initial registry tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-05-31 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('slug', sa.String(length=128), nullable=False, unique=True),
        sa.Column('industry', sa.String(length=128), nullable=False),
        sa.Column('headquarters', sa.String(length=128), nullable=False),
        sa.Column('primary_region', sa.String(length=128), nullable=False),
        sa.Column('warehouse_count', sa.Integer(), nullable=False),
        sa.Column('supplier_count', sa.Integer(), nullable=False),
        sa.Column('monthly_orders', sa.Integer(), nullable=False),
        sa.Column('flagship_workflow', sa.String(length=128), nullable=False),
        sa.Column('db_url', sa.String(length=256), nullable=False),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('email', sa.String(length=128), nullable=False, unique=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id'), nullable=True),
        sa.Column('display_name', sa.String(length=128), nullable=False),
    )

    op.create_table(
        'workflow_registry',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_by', sa.String(length=64), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('workflow_registry')
    op.drop_table('users')
    op.drop_table('tenants')
