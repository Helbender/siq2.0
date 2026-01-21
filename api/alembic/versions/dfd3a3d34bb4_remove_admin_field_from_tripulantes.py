"""remove admin field from tripulantes

Revision ID: dfd3a3d34bb4
Revises: add_rbac_tables
Create Date: 2026-01-21 22:45:17.143230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfd3a3d34bb4'
down_revision: Union[str, None] = 'add_rbac_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove admin column from tripulantes table
    op.drop_column('tripulantes', 'admin')


def downgrade() -> None:
    """Downgrade schema."""
    # Add admin column back to tripulantes table
    op.add_column('tripulantes', sa.Column('admin', sa.BOOLEAN(), nullable=False, server_default='false'))
