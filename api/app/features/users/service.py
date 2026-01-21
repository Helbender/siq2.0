"""Users service containing business logic for user operations."""

import json
from typing import Any

from sqlalchemy.orm import Session

from app.features.users.models import Tripulante  # type: ignore
from app.features.users.repository import UserRepository
from app.shared.enums import StatusTripulante, TipoTripulante  # type: ignore
from app.utils.email import hash_code
from app.utils.gdrive import ID_PASTA_VOO, enviar_json_para_pasta  # type: ignore


class UserService:
    """Service class for user business logic."""

    def __init__(self):
        """Initialize user service with repository."""
        self.repository = UserRepository()

    def get_all_users(self, session: Session) -> list[dict]:
        """Get all users/tripulantes from database.

        Args:
            session: Database session

        Returns:
            List of user dictionaries
        """
        tripulantes_obj = self.repository.find_all(session)

        tripulantes: list[dict] = []
        for t in tripulantes_obj:
            user_dict = {
                "nip": t.nip,
                "name": t.name,
                "tipo": t.tipo.value,
                "rank": t.rank,
                "position": t.position,
                "email": t.email,
                "status": t.status.value,
            }
            # Add role information if available
            role_level_value = (
                t.role.level if t.role else (t.role_level if t.role_level is not None else None)
            )
            if role_level_value is not None:
                user_dict["roleLevel"] = role_level_value
            if t.role:
                user_dict["role"] = t.role.to_json()
            tripulantes.append(user_dict)
        return tripulantes

    def create_user(self, user_data: dict, session: Session) -> dict[str, Any]:
        """Create a new user/tripulante.

        Args:
            user_data: User data dictionary
            session: Database session

        Returns:
            dict with "id" key on success, or error message
        """
        status = StatusTripulante(user_data.get("status", "Presente"))
        tipo = user_data.get("tipo")
        if isinstance(tipo, str):
            # Normalize tipo string to enum value
            tipo = TipoTripulante(tipo)

        user = Tripulante(
            name=user_data["name"],
            nip=user_data["nip"],
            rank=user_data.get("rank"),
            position=user_data.get("position"),
            email=user_data.get("email"),
            password=hash_code(str(12345)),
            tipo=tipo,
            status=status,
        )

        created_user, error = self.repository.create(session, user)
        if error:
            return {"message": error}
        return {"id": created_user.nip}

    def delete_user(self, nip: int, session: Session) -> dict[str, Any]:
        """Delete a user/tripulante.

        Args:
            nip: User NIP
            session: Database session

        Returns:
            dict with "deleted_id" on success, or error message
        """
        deleted = self.repository.delete_by_nip(session, nip)

        if deleted:
            return {"deleted_id": str(nip)}

        return {"message": "Failed to delete"}

    def update_user(self, nip: int, user_data: dict, session: Session) -> dict[str, Any]:
        """Update a user/tripulante.

        Args:
            nip: User NIP
            user_data: User data dictionary with fields to update
            session: Database session

        Returns:
            dict with user data on success, or error message
        """
        modified_user = self.repository.find_by_nip(session, nip)

        if modified_user is None:
            return {"message": f"User with NIP {nip} not found"}

        try:
            for key, value in user_data.items():
                if key == "qualification":
                    continue
                if key == "tipo" and isinstance(value, str):
                    # Normalize tipo string to enum
                    value = TipoTripulante(value)
                if key == "status" and isinstance(value, str):
                    # Normalize status string to enum
                    value = StatusTripulante(value)
                if key == "roleLevel":
                    # Map roleLevel to role_level field
                    modified_user.role_level = value
                    # Try to find matching role by level and update role_id
                    # If no matching role found, role_id will remain None and role_level will be used
                    from sqlalchemy import select
                    from app.shared.rbac_models import Role as RoleModel
                    matching_role = session.scalars(
                        select(RoleModel).where(RoleModel.level == value)
                    ).first()
                    if matching_role:
                        modified_user.role_id = matching_role.id
                    else:
                        # Clear role_id if no matching role found, so role_level takes precedence
                        modified_user.role_id = None
                    continue
                setattr(modified_user, key, value)

            self.repository.update(session, modified_user)
            # Refresh the user to reload relationships (especially role)
            session.refresh(modified_user)
            return modified_user.to_json()
        except Exception:
            session.rollback()
            return {"message": "You can not change the NIP. Create a new user instead."}

    def bulk_create_users(self, users_data: list[dict], session: Session) -> dict[str, Any]:
        """Create multiple users from a list of user data.

        Args:
            users_data: List of user data dictionaries
            session: Database session

        Returns:
            dict with success message
        """
        users: list[Tripulante] = []

        for item in users_data:
            user = Tripulante()
            for key, value in item.items():
                if key == "qualificacoes":
                    continue
                if key == "tipo":
                    value = value.upper().replace(" ", "_").replace("Ç", "C").replace("Ã", "A").replace("Õ", "O")
                if key == "status":
                    value = StatusTripulante(value) if value else StatusTripulante.PRESENTE
                setattr(user, key, value)

            user.password = hash_code("12345")
            if not hasattr(user, "status") or user.status is None:
                user.status = StatusTripulante.PRESENTE

            users.append(user)

        result = self.repository.bulk_create(session, users)
        return {"message": "Users added successfully", **result}

    def backup_users(self, session: Session) -> dict[str, Any]:
        """Create backup of all users and upload to Google Drive.

        Args:
            session: Database session

        Returns:
            dict with success message
        """
        users_list = self.repository.find_all(session)

        user_base: list = []
        for user in users_list:
            user_base.append(user.to_json())

        enviar_json_para_pasta(dados=user_base, nome_arquivo="user_base.json", id_pasta=ID_PASTA_VOO)
        return {"message": "Backup feito com sucesso!"}

