"""add_rbac_tables

Revision ID: add_rbac_tables
Revises: 043089ab34d8
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_rbac_tables"
down_revision: str | None = "043089ab34d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - add RBAC tables."""
    # Create roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Create permissions table
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Create role_permissions join table
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permissions.id"],
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
        ),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    # Add role_id foreign key to tripulantes table
    op.add_column(
        "tripulantes",
        sa.Column("role_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "tripulantes_role_id_fkey",
        "tripulantes",
        "roles",
        ["role_id"],
        ["id"],
    )

    # Insert default roles
    op.execute(
        """
        INSERT INTO roles (name, level, description) VALUES
        ('Super Admin', 100, 'Full system access'),
        ('UNIF', 80, 'UNIF level access'),
        ('Flyers', 60, 'Flyers level access'),
        ('User', 40, 'Standard user access'),
        ('Readonly', 20, 'Read-only access')
        """
    )


def downgrade() -> None:
    """Downgrade schema - remove RBAC tables."""
    # Drop foreign key and column from tripulantes
    op.drop_constraint("tripulantes_role_id_fkey", "tripulantes", type_="foreignkey")
    op.drop_column("tripulantes", "role_id")

    # Drop join table
    op.drop_table("role_permissions")

    # Drop permissions table
    op.drop_table("permissions")

    # Drop roles table
    op.drop_table("roles")
