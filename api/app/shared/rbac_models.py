"""RBAC models for roles, permissions, and role-permission relationships."""

from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base


class Role(Base):
    """Role model representing user roles in the system."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    permissions: Mapped[list["Permission"]] = relationship(
        "Permission", secondary="role_permissions", back_populates="roles"
    )
    users: Mapped[list["Tripulante"]] = relationship("Tripulante", back_populates="role")

    def to_json(self):
        """Convert role to JSON representation."""
        return {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "description": self.description,
            "permissions": [p.to_json() for p in self.permissions],
        }


class Permission(Base):
    """Permission model representing individual permissions in the system."""

    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    roles: Mapped[list["Role"]] = relationship(
        "Role", secondary="role_permissions", back_populates="permissions"
    )

    def to_json(self):
        """Convert permission to JSON representation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
        }


# Join table for many-to-many relationship between roles and permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)
