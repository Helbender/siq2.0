"""Tests for flights feature service layer."""

from datetime import date

import pytest
from sqlalchemy import select

from app.features.flights.models import Flight, FlightAnomaly, FlightPilots
from app.features.flights.service import (
    FlightService,
    _normalize_time,
    coerce_qualification_id,
    safe_int_or_none,
)

# ---------------------------------------------------------------------------
# Dados de teste reutilizáveis
# ---------------------------------------------------------------------------

FLIGHT_DATA_BASE = {
    "date": "2025-01-15",
    "airtask": "00A0001",
    "ATD": "10:00",
    "tailNumber": 16701,
    "origin": "LPPT",
    "destination": "LPFR",
    "ATA": "11:30",
    "flightType": "SAR",
    "flightAction": "OPER",
    "ATE": "01:30",
    "totalLandings": 0,
    "passengers": 0,
    "doe": 0,
    "cargo": 0,
    "numberOfCrew": 2,
    "orm": 0,
    "fuel": 0,
}

UPDATE_DATA_BASE = {
    "date": "2025-06-01",
    "airtask": "00A9999",
    "ATD": "14:00",
    "tailNumber": 16701,
    "origin": "LPPT",
    "destination": "LPBJ",
    "ATA": "15:30",
    "flightType": "SAR",
    "flightAction": "TREI",
    "ATE": "01:30",
    "totalLandings": 0,
    "passengers": 0,
    "doe": 0,
    "cargo": 0,
    "numberOfCrew": 1,
    "orm": 0,
    "fuel": 0,
    "flight_pilots": [],
}


# ---------------------------------------------------------------------------
# Funções puras — sem DB
# ---------------------------------------------------------------------------


class TestSafeIntOrNone:
    def test_com_string_valida(self):
        assert safe_int_or_none("42") == 42

    def test_com_inteiro(self):
        assert safe_int_or_none(42) == 42

    def test_com_none(self):
        assert safe_int_or_none(None) is None

    def test_com_string_vazia(self):
        assert safe_int_or_none("") is None

    def test_com_string_invalida(self):
        assert safe_int_or_none("abc") is None

    def test_com_float_trunca_para_inteiro(self):
        assert safe_int_or_none(3.7) == 3


class TestNormalizeTime:
    def test_com_string_curta(self):
        assert _normalize_time("10:30") == "10:30"

    def test_trunca_a_5_caracteres(self):
        assert _normalize_time("10:30:00") == "10:30"

    def test_com_none(self):
        assert _normalize_time(None) is None

    def test_com_string_vazia(self):
        assert _normalize_time("") is None

    def test_remove_espacos_externos(self):
        assert _normalize_time("  09:15  ") == "09:15"

    def test_com_inteiro(self):
        # int é convertido para str antes de truncar
        assert _normalize_time(1030) == "1030"


class TestCoerceQualificationId:
    def test_com_none(self):
        assert coerce_qualification_id(None) is None

    def test_com_string_vazia(self):
        assert coerce_qualification_id("") is None

    def test_com_false(self):
        assert coerce_qualification_id(False) is None

    def test_com_inteiro(self):
        assert coerce_qualification_id(42) == "42"

    def test_com_string_numerica(self):
        assert coerce_qualification_id("42") == "42"

    def test_com_string_com_espacos(self):
        assert coerce_qualification_id(" 42 ") == "42"

    def test_com_dict_com_id(self):
        assert coerce_qualification_id({"id": 5}) == "5"

    def test_com_lista_com_um_elemento(self):
        assert coerce_qualification_id([3]) == "3"

    def test_com_lista_vazia(self):
        assert coerce_qualification_id([]) is None

    def test_com_string_invalida(self):
        assert coerce_qualification_id("abc") is None

    def test_com_dict_sem_chave_id(self):
        assert coerce_qualification_id({"nome": "test"}) is None


# ---------------------------------------------------------------------------
# FlightService — testes de integração com DB
# ---------------------------------------------------------------------------


class TestGetAllFlights:
    def test_devolve_lista_vazia_sem_dados(self, session):
        svc = FlightService()
        assert svc.get_all_flights(session) == []

    def test_devolve_voo_criado(self, session, flight_factory):
        flight_factory(airtask="00A1234")
        svc = FlightService()
        result = svc.get_all_flights(session)
        assert len(result) == 1
        assert result[0]["airtask"] == "00A1234"

    def test_inclui_campos_obrigatorios(self, session, flight_factory):
        flight_factory()
        result = FlightService().get_all_flights(session)
        voo = result[0]
        for campo in ("id", "date", "airtask", "tailNumber", "flight_pilots", "anomalies"):
            assert campo in voo

    def test_devolve_varios_voos_ordenados_por_data_desc(self, session, flight_factory):
        flight_factory(airtask="00A0001", date=date(2025, 1, 1))
        flight_factory(airtask="00A0002", tailnumber=16702, date=date(2025, 6, 1))
        result = FlightService().get_all_flights(session)
        assert result[0]["date"] == "2025-06-01"
        assert result[1]["date"] == "2025-01-01"


class TestGetAllFlightsPaginated:
    def test_sem_dados_devolve_paginacao_vazia(self, session):
        result = FlightService().get_all_flights_paginated(session, page=1, per_page=10)
        assert result["data"] == []
        assert result["pagination"]["total"] == 0
        assert result["pagination"]["pages"] == 0

    def test_tail_number_invalido_levanta_erro(self, session):
        with pytest.raises(ValueError, match="tail_number"):
            FlightService().get_all_flights_paginated(session, page=1, per_page=10, tail_number="abc")

    def test_date_from_invalida_levanta_erro(self, session):
        with pytest.raises(ValueError, match="date_from"):
            FlightService().get_all_flights_paginated(session, page=1, per_page=10, date_from="15-01-2025")

    def test_date_to_invalida_levanta_erro(self, session):
        with pytest.raises(ValueError, match="date_to"):
            FlightService().get_all_flights_paginated(session, page=1, per_page=10, date_to="31/12/2025")

    def test_filtro_airtask_devolve_apenas_coincidencias(self, session, flight_factory):
        flight_factory(airtask="00A1111")
        flight_factory(airtask="00B2222", tailnumber=16702)
        result = FlightService().get_all_flights_paginated(session, page=1, per_page=10, airtask="00A")
        assert result["pagination"]["total"] == 1
        assert result["data"][0]["airtask"] == "00A1111"

    def test_filtro_tailnumber_devolve_apenas_coincidencias(self, session, flight_factory):
        flight_factory(tailnumber=16701)
        flight_factory(airtask="00A0002", tailnumber=16702)
        result = FlightService().get_all_flights_paginated(session, page=1, per_page=10, tail_number="16701")
        assert result["pagination"]["total"] == 1
        assert result["data"][0]["tailNumber"] == 16701

    def test_calcula_numero_de_paginas_correctamente(self, session, flight_factory):
        for i in range(5):
            flight_factory(airtask=f"00A{i:04d}", tailnumber=16700 + i)
        result = FlightService().get_all_flights_paginated(session, page=1, per_page=2)
        assert result["pagination"]["total"] == 5
        assert result["pagination"]["pages"] == 3
        assert len(result["data"]) == 2

    def test_filtro_por_intervalo_de_datas(self, session, flight_factory):
        flight_factory(airtask="00A0001", date=date(2025, 1, 1))
        flight_factory(airtask="00A0002", tailnumber=16702, date=date(2025, 6, 1))
        flight_factory(airtask="00A0003", tailnumber=16703, date=date(2025, 12, 1))
        result = FlightService().get_all_flights_paginated(
            session, page=1, per_page=10, date_from="2025-03-01", date_to="2025-09-30"
        )
        assert result["pagination"]["total"] == 1
        assert result["data"][0]["airtask"] == "00A0002"


class TestGetAnomalyDescriptions:
    def test_sem_anomalias_devolve_lista_vazia(self, session, flight_factory):
        flight_factory(tailnumber=16701)
        result = FlightService().get_anomaly_descriptions_by_tailnumber(session, 16701)
        assert result == []

    def test_devolve_descricoes_do_voo(self, session, flight_factory):
        flight = flight_factory(tailnumber=16701)
        session.add(FlightAnomaly(flight_id=flight.fid, description="Falha hidráulica"))
        session.add(FlightAnomaly(flight_id=flight.fid, description="Radar inoperativo"))
        session.flush()
        result = FlightService().get_anomaly_descriptions_by_tailnumber(session, 16701)
        assert "Falha hidráulica" in result
        assert "Radar inoperativo" in result

    def test_tailnumber_desconhecido_devolve_lista_vazia(self, session):
        result = FlightService().get_anomaly_descriptions_by_tailnumber(session, 99999)
        assert result == []

    def test_nao_mistura_anomalias_de_aeronaves_diferentes(self, session, flight_factory):
        f1 = flight_factory(tailnumber=16701)
        f2 = flight_factory(airtask="00A0002", tailnumber=16702)
        session.add(FlightAnomaly(flight_id=f1.fid, description="Avaria A"))
        session.add(FlightAnomaly(flight_id=f2.fid, description="Avaria B"))
        session.flush()
        result = FlightService().get_anomaly_descriptions_by_tailnumber(session, 16701)
        assert result == ["Avaria A"]


class TestGetFlightsByCrewSearch:
    def test_termo_vazio_levanta_erro(self, session):
        with pytest.raises(ValueError, match="Search term is required"):
            FlightService().get_flights_by_crew_search(session, "")

    def test_apenas_espacos_levanta_erro(self, session):
        with pytest.raises(ValueError, match="Search term is required"):
            FlightService().get_flights_by_crew_search(session, "   ")

    def test_date_from_invalida_levanta_erro(self, session):
        with pytest.raises(ValueError, match="date_from"):
            FlightService().get_flights_by_crew_search(session, "99901", date_from="invalida")

    def test_date_to_invalida_levanta_erro(self, session):
        with pytest.raises(ValueError, match="date_to"):
            FlightService().get_flights_by_crew_search(session, "99901", date_to="invalida")

    def test_date_from_maior_que_to_levanta_erro(self, session):
        with pytest.raises(ValueError, match="date_from must be before"):
            FlightService().get_flights_by_crew_search(session, "99901", date_from="2025-12-31", date_to="2025-01-01")

    def test_pesquisa_sem_resultados_devolve_lista_vazia(self, session):
        result = FlightService().get_flights_by_crew_search(session, "99901")
        assert result == []

    def test_pesquisa_por_nip_encontra_tripulante(self, session, flight_factory, tripulante_factory):
        tripulante = tripulante_factory(nip=99901)
        flight = flight_factory()
        fp = FlightPilots(flight_id=flight.fid, pilot_id=tripulante.nip, position="PC")
        session.add(fp)
        session.flush()
        result = FlightService().get_flights_by_crew_search(session, "99901")
        assert len(result) == 1
        assert result[0]["nip"] == 99901
        assert result[0]["airtask"] == "00A0001"

    def test_pesquisa_por_nome_encontra_tripulante(self, session, flight_factory, tripulante_factory):
        tripulante = tripulante_factory(nip=99901, name="João Silva")
        flight = flight_factory()
        fp = FlightPilots(flight_id=flight.fid, pilot_id=tripulante.nip, position="PC")
        session.add(fp)
        session.flush()
        result = FlightService().get_flights_by_crew_search(session, "João")
        assert len(result) == 1
        assert result[0]["nip"] == 99901


class TestCreateFlight:
    def test_sem_chave_pilotos_retorna_mensagem(self, session):
        """Chave flight_pilots ausente do payload → retorna erro."""
        result = FlightService().create_flight({**FLIGHT_DATA_BASE}, session)
        assert result == {"message": "At least one pilot is required"}

    def test_com_piloto_desconhecido_cria_voo_sem_flight_pilots(self, session):
        """Piloto não existe na DB — voo é criado mas sem FlightPilots."""
        result = FlightService().create_flight(
            {**FLIGHT_DATA_BASE, "flight_pilots": [{"nip": 99999, "position": "PC"}]},
            session,
        )
        fid = result["message"]
        assert isinstance(fid, int)
        fp_count = session.execute(select(FlightPilots).where(FlightPilots.flight_id == fid)).scalars().all()
        assert fp_count == []

    def test_duplicado_retorna_mensagem_de_conflito(self, session, flight_factory):
        flight_factory(airtask="00A0001", date=date(2025, 1, 15))
        result = FlightService().create_flight({**FLIGHT_DATA_BASE}, session)
        assert "already exists" in result["message"]

    def test_com_tripulante_valido_cria_flight_pilots(self, session, tripulante_factory):
        tripulante_factory(nip=99901)
        result = FlightService().create_flight(
            {**FLIGHT_DATA_BASE, "flight_pilots": [{"nip": 99901, "position": "PC"}]},
            session,
        )
        fid = result["message"]
        assert isinstance(fid, int)
        fp = session.execute(
            select(FlightPilots).where(
                FlightPilots.flight_id == fid,
                FlightPilots.pilot_id == 99901,
            )
        ).scalar_one_or_none()
        assert fp is not None
        assert fp.position == "PC"

    def test_anomalias_sao_guardadas(self, session):
        result = FlightService().create_flight(
            {
                **FLIGHT_DATA_BASE,
                "flight_pilots": [],
                "anomalies": ["Falha motor", "Radar off"],
            },
            session,
        )
        fid = result["message"]
        anomalias = session.execute(select(FlightAnomaly).where(FlightAnomaly.flight_id == fid)).scalars().all()
        descricoes = {a.description for a in anomalias}
        assert descricoes == {"Falha motor", "Radar off"}

    def test_anomalia_longa_e_truncada_a_50_chars(self, session):
        descricao_longa = "A" * 60
        result = FlightService().create_flight(
            {**FLIGHT_DATA_BASE, "flight_pilots": [], "anomalies": [descricao_longa]},
            session,
        )
        fid = result["message"]
        anomalia = session.execute(select(FlightAnomaly).where(FlightAnomaly.flight_id == fid)).scalar_one()
        assert len(anomalia.description) == 50


class TestDeleteFlight:
    def test_voo_nao_encontrado_retorna_msg(self, session):
        result = FlightService().delete_flight(99999, session)
        assert result == {"msg": "Flight not found"}

    def test_apaga_voo_existente(self, session, flight_factory):
        flight = flight_factory()
        fid = flight.fid
        result = FlightService().delete_flight(fid, session)
        assert result == {"deleted_id": f"Flight {fid}"}

    def test_voo_apagado_nao_existe_na_db(self, session, flight_factory):
        flight = flight_factory()
        fid = flight.fid
        FlightService().delete_flight(fid, session)
        found = session.execute(select(Flight).where(Flight.fid == fid)).scalar_one_or_none()
        assert found is None

    def test_anomalias_do_voo_sao_apagadas_em_cascata(self, session, flight_factory):
        flight = flight_factory()
        session.add(FlightAnomaly(flight_id=flight.fid, description="Avaria"))
        session.flush()
        FlightService().delete_flight(flight.fid, session)
        anomalias = session.execute(select(FlightAnomaly).where(FlightAnomaly.flight_id == flight.fid)).scalars().all()
        assert anomalias == []


class TestUpdateFlight:
    def test_voo_nao_encontrado_retorna_msg(self, session):
        result = FlightService().update_flight(99999, {**UPDATE_DATA_BASE}, session)
        assert result == {"message": "Flight not found"}

    def test_actualiza_campos_do_voo(self, session, flight_factory):
        flight = flight_factory(airtask="00A0001")
        fid = flight.fid
        FlightService().update_flight(fid, {**UPDATE_DATA_BASE}, session)
        session.refresh(flight)
        assert flight.airtask == "00A9999"
        assert flight.date == date(2025, 6, 1)
        assert flight.flight_action == "TREI"

    def test_retorna_mensagem_de_sucesso(self, session, flight_factory):
        flight = flight_factory()
        result = FlightService().update_flight(flight.fid, {**UPDATE_DATA_BASE}, session)
        assert result == {"message": "Flight changed"}

    def test_conflito_com_outro_voo_retorna_msg(self, session, flight_factory):
        # voo 1 — natural key que queremos colidir
        flight_factory(airtask="00A0001", date=date(2025, 1, 15))
        # voo 2 — o que vamos tentar actualizar para colidir
        flight2 = flight_factory(airtask="00A0002", tailnumber=16702, date=date(2025, 2, 1))
        result = FlightService().update_flight(
            flight2.fid,
            {
                **UPDATE_DATA_BASE,
                "airtask": "00A0001",
                "date": "2025-01-15",
                "ATD": "10:00",
                "tailNumber": 16701,
            },
            session,
        )
        assert "already exists" in result["message"]

    def test_actualiza_anomalias_do_voo(self, session, flight_factory):
        flight = flight_factory()
        session.add(FlightAnomaly(flight_id=flight.fid, description="Avaria antiga"))
        session.flush()
        FlightService().update_flight(
            flight.fid,
            {**UPDATE_DATA_BASE, "anomalies": ["Avaria nova"]},
            session,
        )
        anomalias = session.execute(select(FlightAnomaly).where(FlightAnomaly.flight_id == flight.fid)).scalars().all()
        assert len(anomalias) == 1
        assert anomalias[0].description == "Avaria nova"


class TestReprocessAllQualifications:
    def test_com_voo_sem_pilotos_nao_tem_erros(self, session, flight_factory):
        flight_factory()
        result = FlightService().reprocess_all_qualifications(session)
        assert result["total_flights"] == 1
        assert result["processed"] == 1
        assert result["errors"] == 0

    def test_sem_voos_devolve_zero(self, session):
        # Nota: reprocess com 0 voos provoca ZeroDivisionError na linha de tempo médio.
        # Este teste documenta o comportamento actual até ser corrigido.
        with pytest.raises(ZeroDivisionError):
            FlightService().reprocess_all_qualifications(session)
