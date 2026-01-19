from enum import Enum

"""
Qualification Group Segregation System

This module provides a system to segregate qualification groups by crew type,
making it easier for the frontend to show only relevant qualifications when
adding new qualifications for specific crew types.

Usage Examples:
- Get qualification groups for PILOTO: get_qualification_groups_for_crew_type(TipoTripulante.PILOTO)
- Check if a group applies to a crew type: is_qualification_group_applicable_to_crew_type(group, crew_type)
- Get all crew types for a group: get_crew_types_for_qualification_group(GrupoQualificacoes.MQP)

API Endpoints:
- GET /api/v2/qualification-groups - Get all qualification groups
- GET /api/v2/crew-types - Get all crew types  
- GET /api/v2/qualification-groups/<crew_type> - Get groups for specific crew type
- GET /api/v2/crew-types-for-group/<group> - Get crew types for specific group
- POST /api/v2/qualification-groups/check - Check if group applies to crew type
"""


class GrupoQualificacoes(Enum):
    # Pilot-specific qualifications
    CURRENCY = "CURRENCY"
    MQP = "MQP"
    MQOBP = "MQOBP"
    MQOIP = "MQOIP"
    MQOAP = "MQOAP"
    STANDARD = "STANDARD"

    # Cabin operator qualifications
    MQOC = "MQOC"
    MQOBOC = "MQOBOC"
    MQOIOC = "MQOIOC"
    MQOAOC = "MQOAOC"

    # Tactical controller qualifications
    MQCT = "MQCT"
    MQOBCT = "MQOBCT"
    MQOICT = "MQOICT"
    MQOACT = "MQOACT"

    # Surveillance operator qualifications
    MQOPV = "MQOPV"
    MQOBOPV = "MQOBOPV"
    MQOIOPV = "MQOIOPV"
    MQOAOPV = "MQOAOPV"

    # Operations qualifications
    OPERATIONS_PLANNING = "OPERATIONS_PLANNING"


class TipoTripulante(Enum):
    PILOTO = "PILOTO"
    OPERADOR_CABINE = "OPERADOR CABINE"
    CONTROLADOR_TATICO = "CONTROLADOR TATICO"
    OPERADOR_VIGILANCIA = "OPERADOR VIGILANCIA"
    OPERACOES = "OPERAÇÕES"


class StatusTripulante(Enum):
    PRESENTE = "Presente"
    FORA = "Fora"


class Role(Enum):
    """User roles with associated access levels."""

    SUPER_ADMIN = 100
    UNIF = 80
    FLYERS = 60
    USER = 40
    READONLY = 20

    @property
    def level(self) -> int:
        """Get the numeric level for this role."""
        return self.value


# Mapping qualification groups to applicable crew types
QUALIFICATION_GROUP_TO_CREW_TYPES = {
    # Pilot qualifications
    GrupoQualificacoes.CURRENCY: [TipoTripulante.PILOTO],
    GrupoQualificacoes.MQP: [TipoTripulante.PILOTO],
    GrupoQualificacoes.MQOBP: [TipoTripulante.PILOTO],
    GrupoQualificacoes.MQOIP: [TipoTripulante.PILOTO],
    GrupoQualificacoes.MQOAP: [TipoTripulante.PILOTO],
    # Cabin operator qualifications
    GrupoQualificacoes.MQOC: [TipoTripulante.OPERADOR_CABINE],
    GrupoQualificacoes.MQOBOC: [TipoTripulante.OPERADOR_CABINE],
    GrupoQualificacoes.MQOIOC: [TipoTripulante.OPERADOR_CABINE],
    GrupoQualificacoes.MQOAOC: [TipoTripulante.OPERADOR_CABINE],
    # Tactical controller qualifications
    GrupoQualificacoes.MQCT: [TipoTripulante.CONTROLADOR_TATICO],
    GrupoQualificacoes.MQOBCT: [TipoTripulante.CONTROLADOR_TATICO],
    GrupoQualificacoes.MQOICT: [TipoTripulante.CONTROLADOR_TATICO],
    GrupoQualificacoes.MQOACT: [TipoTripulante.CONTROLADOR_TATICO],
    # Surveillance operator qualifications
    GrupoQualificacoes.MQOPV: [TipoTripulante.OPERADOR_VIGILANCIA],
    GrupoQualificacoes.MQOBOPV: [TipoTripulante.OPERADOR_VIGILANCIA],
    GrupoQualificacoes.MQOIOPV: [TipoTripulante.OPERADOR_VIGILANCIA],
    GrupoQualificacoes.MQOAOPV: [TipoTripulante.OPERADOR_VIGILANCIA],
    # Operations qualifications
    GrupoQualificacoes.OPERATIONS_PLANNING: [TipoTripulante.OPERACOES],
}


def get_qualification_groups_for_crew_type(crew_type: TipoTripulante) -> list[GrupoQualificacoes]:
    """Get all qualification groups that apply to a specific crew type."""
    applicable_groups = []
    for group, crew_types in QUALIFICATION_GROUP_TO_CREW_TYPES.items():
        if crew_type in crew_types:
            applicable_groups.append(group)
    return applicable_groups


def get_crew_types_for_qualification_group(group: GrupoQualificacoes) -> list[TipoTripulante]:
    """Get all crew types that can use a specific qualification group."""
    return QUALIFICATION_GROUP_TO_CREW_TYPES.get(group, [])


def get_all_qualification_groups() -> list[GrupoQualificacoes]:
    """Get all available qualification groups."""
    return list(GrupoQualificacoes)


def get_all_crew_types() -> list[TipoTripulante]:
    """Get all available crew types."""
    return list(TipoTripulante)


def is_qualification_group_applicable_to_crew_type(group: GrupoQualificacoes, crew_type: TipoTripulante) -> bool:
    """Check if a qualification group is applicable to a specific crew type."""
    return crew_type in QUALIFICATION_GROUP_TO_CREW_TYPES.get(group, [])
