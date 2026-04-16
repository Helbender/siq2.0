"""Replace recover JSON blob with indexed reset_token columns.

Revision ID: a2b3c4d5e6f7
Revises: f7a8b9c0d1e2
Create Date: 2026-04-06
"""

import sqlalchemy as sa

from alembic import op

revision = "a2b3c4d5e6f7"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tripulantes", sa.Column("reset_token", sa.String(64), nullable=True))
    op.add_column("tripulantes", sa.Column("reset_token_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_tripulantes_reset_token", "tripulantes", ["reset_token"])
    op.drop_column("tripulantes", "recover")


def downgrade() -> None:
    op.drop_index("ix_tripulantes_reset_token", table_name="tripulantes")
    op.drop_column("tripulantes", "reset_token_expires_at")
    op.drop_column("tripulantes", "reset_token")
    op.add_column("tripulantes", sa.Column("recover", sa.String(500), nullable=True, server_default=""))
