from enum import Enum


class GrupoQualificacoes(Enum):
    # ALERTA = "ALERTA"
    # VIGILANCIA = "VIGILANCIA"
    # NVG = "NVG"
    # TATICO = "TATICO"
    # OUTROS = "OUTROS"
    # ATR_APPS = "ATR e APPS"
    MQP = "MQP"
    MQOBP = "MQOBP"
    MQOIP = "MQOIP"
    MQOAP = "MQOAP"
    MQOC = "MQOC"
    MQOBOC = "MQOBOC"


class TipoTripulante(Enum):
    PILOTO = "PILOTO"
    OPERADOR_CABINE = "OPERADOR CABINE"
    CONTROLADOR_TATICO = "CONTROLADOR TATICO"
    OPERADOR_VIGILANCIA = "OPERADOR VIGILANCIA"
    OPERACOES = "OPERAÇÕES"
