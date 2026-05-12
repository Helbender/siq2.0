"""Tests for users feature service layer."""

import pytest
from sqlalchemy import select

import app.features.users.service as users_service_module
from app.features.users.models import Tripulante
from app.features.users.service import UserService, _parse_tipo
from app.shared.enums import TipoTripulante
from app.utils.email import hash_code

# ---------------------------------------------------------------------------
# _parse_tipo — função pura
# ---------------------------------------------------------------------------


class TestParseTipo:
    def test_valor_exacto_piloto(self):
        assert _parse_tipo("PILOTO") == TipoTripulante.PILOTO

    def test_valor_com_espaco_operador_cabine(self):
        assert _parse_tipo("OPERADOR CABINE") == TipoTripulante.OPERADOR_CABINE

    def test_valor_com_espaco_coordenador_tatico(self):
        assert _parse_tipo("COORDENADOR TATICO") == TipoTripulante.COORDENADOR_TATICO

    def test_variante_underscore(self):
        assert _parse_tipo("COORDENADOR_TATICO") == TipoTripulante.COORDENADOR_TATICO

    def test_minusculas_aceites(self):
        assert _parse_tipo("piloto") == TipoTripulante.PILOTO

    def test_operacoes_com_caractere_especial(self):
        assert _parse_tipo("OPERAÇÕES") == TipoTripulante.OPERACOES

    def test_operacoes_sem_caractere_especial(self):
        assert _parse_tipo("OPERACOES") == TipoTripulante.OPERACOES

    def test_operador_vigilancia_underscore(self):
        assert _parse_tipo("OPERADOR_VIGILANCIA") == TipoTripulante.OPERADOR_VIGILANCIA

    def test_valor_invalido_levanta_value_error(self):
        with pytest.raises(ValueError, match="is not a valid TipoTripulante"):
            _parse_tipo("TIPO_INVALIDO")

    def test_string_vazia_levanta_value_error(self):
        with pytest.raises((ValueError, KeyError)):
            _parse_tipo("")


# ---------------------------------------------------------------------------
# get_all_users
# ---------------------------------------------------------------------------


class TestGetAllUsers:
    def test_lista_vazia_sem_dados(self, session):
        assert UserService().get_all_users(session) == []

    def test_devolve_tripulante_criado(self, session, tripulante_factory):
        tripulante_factory(nip=11101, name="João Silva")
        result = UserService().get_all_users(session)
        assert len(result) == 1
        assert result[0]["nip"] == 11101

    def test_inclui_nome_do_tripulante(self, session, tripulante_factory):
        tripulante_factory(nip=11102, name="Maria Costa")
        result = UserService().get_all_users(session)
        assert result[0]["name"] == "Maria Costa"

    def test_inclui_campos_obrigatorios(self, session, tripulante_factory):
        tripulante_factory()
        result = UserService().get_all_users(session)
        user = result[0]
        for campo in ("nip", "name", "tipo", "rank", "email", "status"):
            assert campo in user

    def test_status_como_string(self, session, tripulante_factory):
        tripulante_factory()
        result = UserService().get_all_users(session)
        assert result[0]["status"] == "Presente"

    def test_tipo_como_string(self, session, tripulante_factory):
        tripulante_factory(nip=11103)
        result = UserService().get_all_users(session)
        assert result[0]["tipo"] == "PILOTO"

    def test_devolve_multiplos_tripulantes(self, session, tripulante_factory):
        tripulante_factory(nip=11104)
        tripulante_factory(nip=11105, email="outro@esq502.pt")
        result = UserService().get_all_users(session)
        assert len(result) == 2


# ---------------------------------------------------------------------------
# get_all_users_paginated
# ---------------------------------------------------------------------------


class TestGetAllUsersPaginated:
    def test_sem_dados_devolve_paginacao_vazia(self, session):
        result = UserService().get_all_users_paginated(session, page=1, per_page=10)
        assert result["data"] == []
        assert result["pagination"]["total"] == 0

    def test_estrutura_de_paginacao(self, session, tripulante_factory):
        tripulante_factory()
        result = UserService().get_all_users_paginated(session, page=1, per_page=10)
        pag = result["pagination"]
        for campo in ("page", "per_page", "total", "pages"):
            assert campo in pag

    def test_calcula_numero_de_paginas_correctamente(self, session, tripulante_factory):
        for i in range(5):
            tripulante_factory(nip=11200 + i, email=f"u{i}@esq502.pt")
        result = UserService().get_all_users_paginated(session, page=1, per_page=2)
        assert result["pagination"]["total"] == 5
        assert result["pagination"]["pages"] == 3
        assert len(result["data"]) == 2

    def test_segunda_pagina_devolve_proximos(self, session, tripulante_factory):
        for i in range(4):
            tripulante_factory(nip=11300 + i, email=f"p{i}@esq502.pt")
        r1 = UserService().get_all_users_paginated(session, page=1, per_page=2)
        r2 = UserService().get_all_users_paginated(session, page=2, per_page=2)
        nips_p1 = {u["nip"] for u in r1["data"]}
        nips_p2 = {u["nip"] for u in r2["data"]}
        assert nips_p1.isdisjoint(nips_p2)


# ---------------------------------------------------------------------------
# create_user
# ---------------------------------------------------------------------------


class TestCreateUser:
    BASE = {
        "nip": 22201,
        "name": "Piloto Criado",
        "tipo": "PILOTO",
        "rank": "CAP",
        "position": "PC",
        "email": "criado@esq502.pt",
    }

    def test_cria_utilizador_valido(self, session):
        result = UserService().create_user(self.BASE, session)
        assert result == {"id": 22201}

    def test_nip_duplicado_retorna_mensagem_erro(self, session, tripulante_factory):
        tripulante_factory(nip=22201)
        result = UserService().create_user(self.BASE, session)
        assert "message" in result

    def test_password_padrao_e_hash_de_12345(self, session):
        UserService().create_user(self.BASE, session)
        t = session.execute(select(Tripulante).where(Tripulante.nip == 22201)).scalar_one()
        assert t.password == hash_code("12345")

    def test_tipo_como_string_e_parseado(self, session):
        result = UserService().create_user({**self.BASE, "tipo": "COORDENADOR_TATICO"}, session)
        assert "id" in result

    def test_tipo_com_espaco_e_parseado(self, session):
        result = UserService().create_user({**self.BASE, "tipo": "OPERADOR CABINE"}, session)
        assert "id" in result

    def test_status_por_omissao_e_presente(self, session):
        UserService().create_user(self.BASE, session)
        t = session.execute(select(Tripulante).where(Tripulante.nip == 22201)).scalar_one()
        assert t.status.value == "Presente"

    def test_status_fora_e_respeitado(self, session):
        UserService().create_user({**self.BASE, "status": "Fora"}, session)
        t = session.execute(select(Tripulante).where(Tripulante.nip == 22201)).scalar_one()
        assert t.status.value == "Fora"


# ---------------------------------------------------------------------------
# delete_user
# ---------------------------------------------------------------------------


class TestDeleteUser:
    def test_nao_encontrado_retorna_mensagem_falha(self, session):
        result = UserService().delete_user(99999, session)
        assert "message" in result

    def test_apaga_utilizador_existente_devolve_deleted_id(self, session, tripulante_factory):
        tripulante_factory(nip=33301)
        result = UserService().delete_user(33301, session)
        assert result == {"deleted_id": "33301"}

    def test_utilizador_apagado_nao_existe_na_db(self, session, tripulante_factory):
        tripulante_factory(nip=33302)
        UserService().delete_user(33302, session)
        found = session.execute(select(Tripulante).where(Tripulante.nip == 33302)).scalar_one_or_none()
        assert found is None

    def test_apagar_nip_inexistente_nao_afecta_outros(self, session, tripulante_factory):
        tripulante_factory(nip=33303)
        UserService().delete_user(99999, session)  # nip que não existe
        found = session.execute(select(Tripulante).where(Tripulante.nip == 33303)).scalar_one_or_none()
        assert found is not None


# ---------------------------------------------------------------------------
# update_user
# ---------------------------------------------------------------------------


class TestUpdateUser:
    def test_nao_encontrado_retorna_mensagem(self, session):
        result = UserService().update_user(99999, {"name": "Novo"}, session)
        assert "message" in result
        assert "99999" in result["message"]

    def test_actualiza_nome(self, session, tripulante_factory):
        tripulante_factory(nip=44401)
        result = UserService().update_user(44401, {"name": "Nome Actualizado"}, session)
        assert result["name"] == "Nome Actualizado"

    def test_actualiza_rank(self, session, tripulante_factory):
        tripulante_factory(nip=44402)
        result = UserService().update_user(44402, {"rank": "TEN"}, session)
        assert result["rank"] == "TEN"

    def test_actualiza_tipo_como_string(self, session, tripulante_factory):
        tripulante_factory(nip=44403)
        result = UserService().update_user(44403, {"tipo": "OPERADOR CABINE"}, session)
        assert result["tipo"] == "OPERADOR CABINE"

    def test_actualiza_status_como_string(self, session, tripulante_factory):
        tripulante_factory(nip=44404)
        result = UserService().update_user(44404, {"status": "Fora"}, session)
        assert result["status"] == "Fora"

    def test_alterar_nip_para_existente_retorna_mensagem_erro(self, session, tripulante_factory):
        """Mudar NIP para um que já existe → conflito de PK → mensagem de erro."""
        tripulante_factory(nip=44405)
        tripulante_factory(nip=44406, email="outro@esq502.pt")
        result = UserService().update_user(44405, {"nip": 44406}, session)
        assert "message" in result

    def test_resultado_inclui_qualificacoes(self, session, tripulante_factory):
        tripulante_factory(nip=44406)
        result = UserService().update_user(44406, {"name": "Teste"}, session)
        assert "qualificacoes" in result

    def test_campo_qualification_ignorado(self, session, tripulante_factory):
        tripulante_factory(nip=44407)
        # "qualification" é ignorado pelo update — não deve levantar erro
        result = UserService().update_user(44407, {"qualification": "XYZ", "name": "Ok"}, session)
        assert result["name"] == "Ok"

    def test_actualiza_role_level_sem_role_na_db(self, session, tripulante_factory):
        tripulante_factory(nip=44408)
        result = UserService().update_user(44408, {"roleLevel": 60}, session)
        # Sem Role na DB, role_level é actualizado mas role_id fica None
        assert result is not None  # não levanta excepção


# ---------------------------------------------------------------------------
# bulk_create_users
# ---------------------------------------------------------------------------


class TestBulkCreateUsers:
    BASE_USER = {
        "nip": 55501,
        "name": "Bulk Teste",
        "tipo": "PILOTO",
        "rank": "CAP",
        "position": "PC",
        "email": "bulk@esq502.pt",
        "status": "Presente",
    }

    def test_cria_utilizador_simples(self, session):
        result = UserService().bulk_create_users([self.BASE_USER], session)
        assert result["created"] == 1
        assert result["failed"] == 0

    def test_mensagem_de_sucesso_incluida(self, session):
        result = UserService().bulk_create_users([self.BASE_USER], session)
        assert result["message"] == "Users added successfully"

    def test_duplicado_conta_como_falha(self, session, tripulante_factory):
        tripulante_factory(nip=55501)
        result = UserService().bulk_create_users([self.BASE_USER], session)
        assert result["failed"] == 1
        assert result["created"] == 0

    def test_mistura_validos_e_duplicados(self, session, tripulante_factory):
        tripulante_factory(nip=55501)
        result = UserService().bulk_create_users(
            [
                self.BASE_USER,  # duplicado
                {**self.BASE_USER, "nip": 55502, "email": "novo@esq502.pt"},
            ],
            session,
        )
        assert result["created"] == 1
        assert result["failed"] == 1

    def test_tipo_underscore_parseado(self, session):
        result = UserService().bulk_create_users([{**self.BASE_USER, "tipo": "COORDENADOR_TATICO"}], session)
        assert result["created"] == 1

    def test_campos_nao_permitidos_sao_ignorados(self, session):
        result = UserService().bulk_create_users([{**self.BASE_USER, "qualificacoes": [], "role": {"id": 1}}], session)
        assert result["created"] == 1

    def test_password_padrao_e_hash_de_12345(self, session):
        UserService().bulk_create_users([self.BASE_USER], session)
        t = session.execute(select(Tripulante).where(Tripulante.nip == 55501)).scalar_one()
        assert t.password == hash_code("12345")

    def test_lista_vazia_nao_falha(self, session):
        result = UserService().bulk_create_users([], session)
        assert result["created"] == 0
        assert result["failed"] == 0

    def test_status_ausente_usa_presente_por_omissao(self, session):
        user_sem_status = {k: v for k, v in self.BASE_USER.items() if k != "status"}
        UserService().bulk_create_users([user_sem_status], session)
        t = session.execute(select(Tripulante).where(Tripulante.nip == 55501)).scalar_one()
        assert t.status.value == "Presente"


# ---------------------------------------------------------------------------
# backup_users
# ---------------------------------------------------------------------------


class TestBackupUsers:
    def test_fora_de_producao_retorna_mensagem_desactivado(self, session, monkeypatch):
        monkeypatch.setattr(users_service_module, "FLASK_ENV", "development")
        result = UserService().backup_users(session)
        assert "disabled" in result["message"].lower()

    def test_fora_de_producao_inclui_flask_env(self, session, monkeypatch):
        monkeypatch.setattr(users_service_module, "FLASK_ENV", "development")
        result = UserService().backup_users(session)
        assert "flask_env" in result
