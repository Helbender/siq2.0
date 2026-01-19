"""add_rbac_tables

Revision ID: add_rbac_tables
Revises: 043089ab34d8
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_rbac_tables"
down_revision: str | None = "043089ab34d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - add RBAC tables."""
    inspector = inspect(op.get_bind())
    existing_tables = inspector.get_table_names()
    existing_columns = {}
    if 'tripulantes' in existing_tables:
        existing_columns = {col['name'] for col in inspector.get_columns('tripulantes')}
    
    # Create roles table if it doesn't exist
    if 'roles' not in existing_tables:
        op.create_table(
            "roles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=50), nullable=False),
            sa.Column("level", sa.Integer(), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
        )
    
    # Create permissions table if it doesn't exist
    if 'permissions' not in existing_tables:
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
        )
    
    # Create role_permissions join table if it doesn't exist
    if 'role_permissions' not in existing_tables:
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
    
    # Add role_id to tripulantes table if it doesn't exist
    if 'role_id' not in existing_columns:
        op.add_column(
            "tripulantes",
            sa.Column("role_id", sa.Integer(), nullable=True),
        )
    
    # Add role_level to tripulantes table if it doesn't exist
    if 'role_level' not in existing_columns:
        op.add_column(
            "tripulantes",
            sa.Column("role_level", sa.Integer(), nullable=True, server_default="40"),
        )
    
    # Create foreign key if it doesn't exist
    if 'role_id' not in existing_columns:
        try:
            op.create_foreign_key(
                "tripulantes_role_id_fkey",
                "tripulantes",
                "roles",
                ["role_id"],
                ["id"],
            )
        except Exception:
            pass  # Foreign key might already exist
    
    # Insert default roles if they don't exist
    if 'roles' not in existing_tables:
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
    else:
        # Check if roles exist and insert only missing ones
        conn = op.get_bind()
        result = conn.execute(sa.text("SELECT name FROM roles"))
        existing_role_names = {row[0] for row in result.fetchall()}
        roles_to_insert = [
            ('Super Admin', 100, 'Full system access'),
            ('UNIF', 80, 'UNIF level access'),
            ('Flyers', 60, 'Flyers level access'),
            ('User', 40, 'Standard user access'),
            ('Readonly', 20, 'Read-only access')
        ]
        for name, level, desc in roles_to_insert:
            if name not in existing_role_names:
                op.execute(
                    sa.text(f"INSERT INTO roles (name, level, description) VALUES ('{name}', {level}, '{desc}')")
                )


def downgrade() -> None:
    """Downgrade schema - remove RBAC tables."""
    # Drop foreign key and columns from tripulantes
    # Check if constraints/columns exist before dropping
    from sqlalchemy import inspect
    
    inspector = inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('tripulantes')]
    
    # Drop foreign key if it exists
    try:
        op.drop_constraint("tripulantes_role_id_fkey", "tripulantes", type_="foreignkey")
    except Exception:
        pass  # Constraint might not exist
    
    # Drop columns if they exist
    if "role_id" in columns:
        op.drop_column("tripulantes", "role_id")
    if "role_level" in columns:
        op.drop_column("tripulantes", "role_level")

    # Drop join table
    op.drop_table("role_permissions")

    # Drop permissions table
    op.drop_table("permissions")

    # Drop roles table
    op.drop_table("roles")
