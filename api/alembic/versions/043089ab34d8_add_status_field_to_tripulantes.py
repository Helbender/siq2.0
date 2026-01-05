"""add_status_field_to_tripulantes

Revision ID: 043089ab34d8
Revises: c34264f16adc
Create Date: 2025-12-13 17:32:43.649224

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "043089ab34d8"
down_revision: str | None = "c34264f16adc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "tripulantes",
        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="Presente",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("tripulantes", "status")
