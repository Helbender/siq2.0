"""Tests for auth feature service layer."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

from app.features.auth.service import AuthError, AuthService
from app.utils.email import hash_code

# Senha conhecida usada nos testes de autenticação
SENHA_TESTE = "senha_secreta_123"
SENHA_HASH = hash_code(SENHA_TESTE)


# ---------------------------------------------------------------------------
# Fixture local: tripulante com password correctamente hashed
# ---------------------------------------------------------------------------


@pytest.fixture
def auth_tripulante(tripulante_factory):
    """Tripulante com password hashed pronta para testar authenticate_user."""
    return tripulante_factory(nip=88801, password=SENHA_HASH)


# ---------------------------------------------------------------------------
# get_refresh_token_cookie_kwargs — função estática pura
# ---------------------------------------------------------------------------


class TestGetRefreshTokenCookieKwargs:
    def test_chave_do_cookie(self):
        result = AuthService.get_refresh_token_cookie_kwargs("token_qualquer")
        assert result["key"] == "siq2_refresh_token"

    def test_httponly_activado(self):
        result = AuthService.get_refresh_token_cookie_kwargs("token_qualquer")
        assert result["httponly"] is True

    def test_samesite_lax_por_omissao(self, monkeypatch):
        monkeypatch.delenv("JWT_COOKIE_SAMESITE", raising=False)
        result = AuthService.get_refresh_token_cookie_kwargs("tok")
        assert result["samesite"] == "Lax"

    def test_samesite_none_forca_secure(self, monkeypatch):
        monkeypatch.setenv("JWT_COOKIE_SAMESITE", "None")
        result = AuthService.get_refresh_token_cookie_kwargs("tok")
        assert result["samesite"] == "None"
        assert result["secure"] is True

    def test_max_age_e_30_dias(self):
        result = AuthService.get_refresh_token_cookie_kwargs("tok")
        assert result["max_age"] == int(timedelta(days=30).total_seconds())

    def test_path_restrito_a_auth(self):
        result = AuthService.get_refresh_token_cookie_kwargs("tok")
        assert result["path"] == "/api/auth"

    def test_valor_do_token_preservado(self):
        result = AuthService.get_refresh_token_cookie_kwargs("meu_token_secreto")
        assert result["value"] == "meu_token_secreto"


# ---------------------------------------------------------------------------
# authenticate_user
# ---------------------------------------------------------------------------


class TestAuthenticateUser:
    def test_nip_invalido_levanta_auth_error(self, session, flask_app):
        with flask_app.app_context():
            with pytest.raises(AuthError) as exc:
                AuthService().authenticate_user("nao_e_numero", "qualquer", session)
            assert exc.value.status_code == 400

    def test_utilizador_nao_encontrado_levanta_auth_error(self, session, flask_app):
        with flask_app.app_context():
            with pytest.raises(AuthError) as exc:
                AuthService().authenticate_user(99999, "qualquer", session)
            assert exc.value.status_code == 404

    def test_password_errada_levanta_auth_error(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            with pytest.raises(AuthError) as exc:
                AuthService().authenticate_user(auth_tripulante.nip, "senha_errada", session)
            assert exc.value.status_code == 401

    def test_credenciais_correctas_devolve_access_token(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().authenticate_user(auth_tripulante.nip, SENHA_TESTE, session)
            assert "access_token" in result

    def test_credenciais_correctas_devolve_refresh_token(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().authenticate_user(auth_tripulante.nip, SENHA_TESTE, session)
            assert "refresh_token" in result

    def test_nip_como_string_e_aceite(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().authenticate_user(str(auth_tripulante.nip), SENHA_TESTE, session)
            assert "access_token" in result

    def test_tokens_sao_strings(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().authenticate_user(auth_tripulante.nip, SENHA_TESTE, session)
            assert isinstance(result["access_token"], str)
            assert isinstance(result["refresh_token"], str)


# ---------------------------------------------------------------------------
# refresh_access_token
# ---------------------------------------------------------------------------


class TestRefreshAccessToken:
    def test_nip_invalido_levanta_auth_error(self, session, flask_app):
        with flask_app.app_context():
            with pytest.raises(AuthError) as exc:
                AuthService().refresh_access_token("nao_e_numero", session)
            assert exc.value.status_code == 400

    def test_utilizador_nao_encontrado_levanta_auth_error(self, session, flask_app):
        with flask_app.app_context():
            with pytest.raises(AuthError) as exc:
                AuthService().refresh_access_token(99999, session)
            assert exc.value.status_code == 404

    def test_utilizador_valido_devolve_string(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().refresh_access_token(auth_tripulante.nip, session)
            assert isinstance(result, str)

    def test_nip_como_string_e_aceite(self, session, flask_app, auth_tripulante):
        with flask_app.app_context():
            result = AuthService().refresh_access_token(str(auth_tripulante.nip), session)
            assert isinstance(result, str)


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------


class TestGetCurrentUser:
    def test_identity_invalida_levanta_auth_error(self, session):
        with pytest.raises(AuthError) as exc:
            AuthService().get_current_user("admin", session)
        assert exc.value.status_code == 400

    def test_utilizador_nao_encontrado_levanta_auth_error(self, session):
        with pytest.raises(AuthError) as exc:
            AuthService().get_current_user(99999, session)
        assert exc.value.status_code == 404

    def test_utilizador_encontrado_devolve_nip(self, session, tripulante_factory):
        tripulante_factory(nip=77701)
        result = AuthService().get_current_user(77701, session)
        assert result["nip"] == 77701

    def test_utilizador_encontrado_devolve_nome(self, session, tripulante_factory):
        tripulante_factory(nip=77702, name="Maria Costa")
        result = AuthService().get_current_user(77702, session)
        assert result["name"] == "Maria Costa"

    def test_resultado_inclui_qualificacoes(self, session, tripulante_factory):
        tripulante_factory(nip=77703)
        result = AuthService().get_current_user(77703, session)
        assert "qualificacoes" in result

    def test_resultado_inclui_role_level(self, session, tripulante_factory):
        tripulante_factory(nip=77704)
        result = AuthService().get_current_user(77704, session)
        assert "roleLevel" in result

    def test_nip_como_string_e_aceite(self, session, tripulante_factory):
        tripulante_factory(nip=77705)
        result = AuthService().get_current_user("77705", session)
        assert result["nip"] == 77705


# ---------------------------------------------------------------------------
# create_reset_token
# ---------------------------------------------------------------------------


class TestCreateResetToken:
    def test_devolve_string_nao_vazia(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        assert isinstance(token, str) and len(token) > 0

    def test_token_e_guardado_no_utilizador(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        session.refresh(t)
        assert t.reset_token == token

    def test_expiry_e_definido(self, session, tripulante_factory):
        t = tripulante_factory()
        AuthService().create_reset_token(t, session)
        session.refresh(t)
        assert t.reset_token_expires_at is not None

    def test_expiry_e_no_futuro(self, session, tripulante_factory):
        t = tripulante_factory()
        AuthService().create_reset_token(t, session)
        session.refresh(t)
        expiry = t.reset_token_expires_at
        # SQLite devolve datetimes naive; normalizar para comparação correcta
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=UTC)
        assert expiry > datetime.now(UTC)

    def test_tokens_consecutivos_sao_diferentes(self, session, tripulante_factory):
        t = tripulante_factory()
        token1 = AuthService().create_reset_token(t, session)
        token2 = AuthService().create_reset_token(t, session)
        assert token1 != token2


# ---------------------------------------------------------------------------
# reset_password
# ---------------------------------------------------------------------------


class TestResetPassword:
    def test_password_vazia_levanta_auth_error(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        with pytest.raises(AuthError) as exc:
            AuthService().reset_password(token, "", session)
        assert exc.value.status_code == 400

    def test_token_invalido_levanta_auth_error(self, session):
        with pytest.raises(AuthError) as exc:
            AuthService().reset_password("token_inexistente", "nova_senha", session)
        assert exc.value.status_code == 404

    def test_token_expirado_levanta_auth_error(self, session, tripulante_factory):
        t = tripulante_factory()
        token = "token_expirado_teste"
        t.reset_token = token
        t.reset_token_expires_at = datetime.now(UTC) - timedelta(hours=1)
        session.flush()
        with pytest.raises(AuthError) as exc:
            AuthService().reset_password(token, "nova_senha", session)
        assert exc.value.status_code == 404
        assert "expired" in exc.value.message.lower()

    def test_password_actualizada_com_sucesso(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        AuthService().reset_password(token, "nova_senha_segura", session)
        session.refresh(t)
        assert t.password == hash_code("nova_senha_segura")

    def test_token_apagado_apos_reset(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        AuthService().reset_password(token, "nova_senha_segura", session)
        session.refresh(t)
        assert t.reset_token is None

    def test_expiry_apagado_apos_reset(self, session, tripulante_factory):
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        AuthService().reset_password(token, "nova_senha_segura", session)
        session.refresh(t)
        assert t.reset_token_expires_at is None

    def test_token_invalido_apos_uso(self, session, tripulante_factory):
        """Depois de reset, o mesmo token não pode ser usado de novo."""
        t = tripulante_factory()
        token = AuthService().create_reset_token(t, session)
        AuthService().reset_password(token, "senha_um", session)
        with pytest.raises(AuthError):
            AuthService().reset_password(token, "senha_dois", session)


# ---------------------------------------------------------------------------
# send_reset_password_email — mockar send_email
# ---------------------------------------------------------------------------


class TestSendResetPasswordEmail:
    def test_envia_email_para_o_utilizador(self, tripulante_factory, session):
        t = tripulante_factory(email="piloto@esq502.pt")
        with patch("app.features.auth.service.send_email") as mock_send:
            AuthService.send_reset_password_email(t, "token_abc")
            mock_send.assert_called_once()
            _, kwargs = mock_send.call_args
            recipients = mock_send.call_args[1].get("recipients") or mock_send.call_args[0][1]
            assert "piloto@esq502.pt" in recipients

    def test_assunto_do_email(self, tripulante_factory, session):
        t = tripulante_factory()
        with patch("app.features.auth.service.send_email") as mock_send:
            AuthService.send_reset_password_email(t, "token_abc")
            subject = mock_send.call_args[1].get("subject") or mock_send.call_args[0][0]
            assert "Reset" in subject or "reset" in subject

    def test_link_contem_token(self, tripulante_factory, session):
        t = tripulante_factory()
        with patch("app.features.auth.service.send_email") as mock_send:
            AuthService.send_reset_password_email(t, "meu_token_xyz")
            body = mock_send.call_args[1].get("body") or mock_send.call_args[0][2]
            assert "meu_token_xyz" in body
