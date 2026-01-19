"""Qualifications service containing business logic for qualification operations."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.qualifications.models import Qualificacao  # type: ignore
from app.features.users.models import Tripulante  # type: ignore
from app.shared.enums import (
    GrupoQualificacoes,
    StatusTripulante,
    TipoTripulante,
    get_all_crew_types,
    get_all_qualification_groups,
    get_crew_types_for_qualification_group,
    get_qualification_groups_for_crew_type,
    is_qualification_group_applicable_to_crew_type,
)


class QualificationService:
    """Service class for qualification business logic."""

    def get_all_qualifications(self, session: Session) -> list[dict]:
        """Get all qualifications from database.

        Args:
            session: Database session

        Returns:
            List of qualification dictionaries
        """
        stmt = select(Qualificacao).order_by(Qualificacao.grupo, Qualificacao.nome)
        qualificacoes = session.execute(stmt).scalars().all()

        result = [
            {
                "id": q.id,
                "nome": q.nome,
                "validade": q.validade,
                "tipo_aplicavel": q.tipo_aplicavel.value,
                "grupo": q.grupo.value,
            }
            for q in qualificacoes
        ]

        return result

    def create_qualification(self, qualification_data: dict, session: Session) -> dict[str, Any]:
        """Create a new qualification.

        Args:
            qualification_data: Qualification data dictionary
            session: Database session

        Returns:
            dict with "id" key on success, or error message
        """
        try:
            tipo_enum = TipoTripulante(qualification_data["tipo_aplicavel"])
        except ValueError:
            return {"error": f"Tipo de tripulante inválido: {qualification_data['tipo_aplicavel']}"}

        try:
            grupo_enum = GrupoQualificacoes(qualification_data["grupo"])
        except ValueError:
            return {"error": f"Grupo de Qualificação inválido: {qualification_data['grupo']}"}

        qualification = Qualificacao(
            nome=qualification_data["nome"],
            validade=qualification_data["validade"],
            tipo_aplicavel=tipo_enum,
            grupo=grupo_enum,
        )

        session.add(qualification)
        session.commit()
        return {"id": qualification.id}

    def get_qualification(self, qualification_id: int, session: Session) -> dict[str, Any] | None:
        """Get a qualification by ID.

        Args:
            qualification_id: Qualification ID
            session: Database session

        Returns:
            Qualification dictionary or None if not found
        """
        stmt = select(Qualificacao).where(Qualificacao.id == qualification_id)
        qualification = session.execute(stmt).scalar_one_or_none()
        if not qualification:
            return None

        return {
            "id": qualification.id,
            "nome": qualification.nome,
            "validade": qualification.validade,
            "tipo_aplicavel": qualification.tipo_aplicavel.value,
            "grupo": qualification.grupo.value,
        }

    def update_qualification(self, qualification_id: int, qualification_data: dict, session: Session) -> dict[str, Any]:
        """Update a qualification.

        Args:
            qualification_id: Qualification ID
            qualification_data: Qualification data dictionary with fields to update
            session: Database session

        Returns:
            dict with "id" key on success, or error message
        """
        stmt = select(Qualificacao).where(Qualificacao.id == qualification_id)
        qualification = session.execute(stmt).scalar_one_or_none()

        if not qualification:
            return {"error": "Qualificação não encontrada"}

        if "nome" in qualification_data:
            qualification.nome = qualification_data["nome"]
        if "validade" in qualification_data:
            qualification.validade = qualification_data["validade"]
        if "tipo_aplicavel" in qualification_data:
            try:
                tipo_enum = TipoTripulante(qualification_data["tipo_aplicavel"])
                qualification.tipo_aplicavel = tipo_enum
            except ValueError:
                return {"error": f"Tipo de tripulante inválido: {qualification_data['tipo_aplicavel']}"}
        if "grupo" in qualification_data:
            try:
                grupo_enum = GrupoQualificacoes(qualification_data["grupo"])
                qualification.grupo = grupo_enum
            except ValueError:
                return {"error": f"Grupo de Qualificação inválido: {qualification_data['grupo']}"}

        session.commit()
        return {"id": qualification.id}

    def delete_qualification(self, qualification_id: int, session: Session) -> dict[str, Any]:
        """Delete a qualification.

        Args:
            qualification_id: Qualification ID
            session: Database session

        Returns:
            dict with success message, or error message
        """
        stmt = select(Qualificacao).where(Qualificacao.id == qualification_id)
        qualification = session.execute(stmt).scalar_one_or_none()

        if not qualification:
            return {"error": "Qualificação não encontrada"}

        session.delete(qualification)
        session.commit()
        return {"mensagem": "Qualificação apagada com sucesso."}

    def get_qualifications_for_tripulante_type(self, tipo: str, session: Session) -> list[dict]:
        """Get all tripulantes of a specific type with their qualifications.

        Args:
            tipo: Tripulante type
            session: Database session

        Returns:
            List of tripulante dictionaries with qualifications
        """
        stmt = (
            select(Tripulante)
            .where(Tripulante.tipo == tipo, Tripulante.status == StatusTripulante.PRESENTE.value)
            .order_by(Tripulante.nip, Tripulante.rank)
        )
        tripulantes = session.execute(stmt).scalars().all()

        return [t.to_json() for t in tripulantes]

    def get_qualifications_for_tripulante_nip(self, nip: int, session: Session) -> dict[str, Any]:
        """Get available qualifications for a specific tripulante.

        Args:
            nip: Tripulante NIP
            session: Database session

        Returns:
            dict with qualification list, or error message
        """
        stmt = select(Tripulante).where(Tripulante.nip == nip)
        tripulante = session.execute(stmt).scalar_one_or_none()

        if not tripulante:
            return {"error": "Tripulante não encontrado"}

        stmt2 = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tripulante.tipo)
        qualificacoes = session.execute(stmt2).scalars().all()
        return {"qualifications": [{"id": q.id, "nome": q.nome} for q in qualificacoes]}

    def get_lists(self) -> dict[str, Any]:
        """Get lists of types and groups.

        Returns:
            dict with tipos and grupos lists
        """
        return {
            "tipos": [t.value for t in TipoTripulante],
            "grupos": [g.value for g in GrupoQualificacoes],
        }

    def get_qualification_groups(self) -> list[dict]:
        """Get all available qualification groups.

        Returns:
            List of group dictionaries
        """
        groups = get_all_qualification_groups()
        return [{"value": group.value, "name": group.value} for group in groups]

    def get_crew_types(self) -> list[dict]:
        """Get all available crew types.

        Returns:
            List of crew type dictionaries
        """
        crew_types = get_all_crew_types()
        return [{"value": crew_type.value, "name": crew_type.value} for crew_type in crew_types]

    def get_qualification_groups_for_crew_type(self, crew_type: str) -> dict[str, Any]:
        """Get qualification groups applicable to a specific crew type.

        Args:
            crew_type: Crew type string

        Returns:
            dict with groups list, or error message
        """
        try:
            crew_type_enum = TipoTripulante(crew_type)
        except ValueError:
            return {"error": f"Invalid crew type: {crew_type}"}

        groups = get_qualification_groups_for_crew_type(crew_type_enum)
        return {"groups": [{"value": group.value, "name": group.value} for group in groups]}

    def get_crew_types_for_group(self, group: str) -> dict[str, Any]:
        """Get crew types that can use a specific qualification group.

        Args:
            group: Qualification group string

        Returns:
            dict with crew_types list, or error message
        """
        try:
            group_enum = GrupoQualificacoes(group)
        except ValueError:
            return {"error": f"Invalid qualification group: {group}"}

        crew_types = get_crew_types_for_qualification_group(group_enum)
        return {"crew_types": [{"value": crew_type.value, "name": crew_type.value} for crew_type in crew_types]}

    def check_qualification_group_applicability(self, group: str, crew_type: str) -> dict[str, Any]:
        """Check if a qualification group is applicable to a crew type.

        Args:
            group: Qualification group string
            crew_type: Crew type string

        Returns:
            dict with "applicable" boolean, or error message
        """
        try:
            group_enum = GrupoQualificacoes(group)
            crew_type_enum = TipoTripulante(crew_type)
        except ValueError as e:
            return {"error": f"Invalid data: {e}"}

        is_applicable = is_qualification_group_applicable_to_crew_type(group_enum, crew_type_enum)
        return {"applicable": is_applicable}
