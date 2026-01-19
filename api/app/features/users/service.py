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

        tripulantes: list[dict] = [
            {
                "nip": t.nip,
                "name": t.name,
                "tipo": t.tipo.value,
                "rank": t.rank,
                "position": t.position,
                "email": t.email,
                "admin": t.admin,
                "status": t.status.value,
            }
            for t in tripulantes_obj
        ]
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
            admin=bool(user_data.get("admin", False)),
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
                setattr(modified_user, key, value)

            self.repository.update(session, modified_user)
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

