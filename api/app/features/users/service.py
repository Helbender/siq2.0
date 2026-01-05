"""Users service containing business logic for user operations."""

import json
from typing import Any

from sqlalchemy import delete, exc, select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session

from app.utils.gdrive import ID_PASTA_VOO, enviar_json_para_pasta  # type: ignore
from models.enums import StatusTripulante, TipoTripulante  # type: ignore
from models.tripulantes import Tripulante  # type: ignore

from app.utils.email import hash_code


class UserService:
    """Service class for user business logic."""

    def get_all_users(self, session: Session) -> list[dict]:
        """Get all users/tripulantes from database.

        Args:
            session: Database session

        Returns:
            List of user dictionaries
        """
        tripulantes_obj = session.execute(select(Tripulante)).scalars().all()

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

        try:
            session.add(user)
            session.commit()
            return {"id": user.nip}
        except exc.IntegrityError as e:
            session.rollback()
            return {"message": str(e.orig)}

    def delete_user(self, nip: int, session: Session) -> dict[str, Any]:
        """Delete a user/tripulante.

        Args:
            nip: User NIP
            session: Database session

        Returns:
            dict with "deleted_id" on success, or error message
        """
        result = session.execute(delete(Tripulante).where(Tripulante.nip == nip))

        if result.rowcount == 1:
            session.commit()
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
        try:
            modified_user = session.execute(select(Tripulante).where(Tripulante.nip == nip)).scalar_one()

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

            session.commit()
            return modified_user.to_json()
        except NoResultFound:
            return {"message": f"User with NIP {nip} not found"}
        except Exception as e:
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
        def check_integrity():
            try:
                session.commit()
            except IntegrityError as e:
                session.rollback()

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

            session.add(user)
            check_integrity()

        session.commit()
        return {"message": "Users added successfully"}

    def backup_users(self, session: Session) -> dict[str, Any]:
        """Create backup of all users and upload to Google Drive.

        Args:
            session: Database session

        Returns:
            dict with success message
        """
        users_list = session.execute(select(Tripulante)).scalars()

        user_base: list = []
        for user in users_list:
            user_base.append(user.to_json())

        enviar_json_para_pasta(dados=user_base, nome_arquivo="user_base.json", id_pasta=ID_PASTA_VOO)
        return {"message": "Backup feito com sucesso!"}

