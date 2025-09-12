from datetime import datetime

from flask import Blueprint, Response, abort, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from config import engine  # type:ignore
from models.qualificacoes import GrupoQualificacoes, Qualificacao
from models.tripulantes import TipoTripulante, Tripulante, TripulanteQualificacao

v2 = Blueprint("v2", __name__)


# 3. Criar qualificação com tipos permitidos
@v2.route("/qualificacoes", methods=["POST"])
def criar_qualificacao() -> Response:
    data = request.get_json()
    print(data)

    # Valida o tipo aplicável
    try:
        tipo_enum = TipoTripulante(data["tipo_aplicavel"])
    except ValueError:
        abort(400, f"Tipo de tripulante inválido: {data['tipo_aplicavel']}")

    # Valida o grupo
    try:
        grupo_enum = GrupoQualificacoes(data["grupo"])
    except ValueError:
        abort(400, f"Grupo de Qualificação inválido: {data['grupo']}")

    # Cria a qualificação
    q = Qualificacao(
        nome=data["nome"],
        validade=data["validade"],
        tipo_aplicavel=tipo_enum,
        grupo=grupo_enum,
    )

    with Session(engine) as session:
        session.add(q)
        session.commit()
        return jsonify({"id": q.id})


@v2.route("/qualificacoes/<int:nip>", methods=["GET"])
def listar_qualificacoes_nip(nip: int) -> Response:
    with Session(engine) as session:
        tripulante = session.get(Tripulante, nip)
        if not tripulante:
            abort(404, "Tripulante não encontrado")

        stmt = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tripulante.tipo)
        result = session.execute(stmt).scalars().all()
        resultados = [l.nome for l in result]
        return jsonify(resultados)


# 4. Listar qualificações válidas para um tipo de tripulante
@v2.route("/qualificacoes/<tipo>", methods=["GET"])
def listar_qualificacoes_por_tipo(tipo: str) -> Response:
    # Valida o tipo
    try:
        tipo_enum = TipoTripulante(tipo)
    except ValueError:
        abort(400, f"Tipo de tripulante inválido: {tipo}")
    with Session(engine) as session:
        stmt = select(Qualificacao).where(Qualificacao.tipo_aplicavel == tipo_enum)
        qualificacoes = session.execute(stmt).unique().scalars().all()
        result = [
            {
                "id": q.id,
                "nome": q.nome,
                "validade": q.validade,
                "grupo": q.grupo.value,
                "tipo_aplicavel": q.tipo_aplicavel.value,
            }
            for q in qualificacoes
        ]

        return jsonify(result)


# 4.1 Listar qualificações válidas para um tipo de tripulante
@v2.route("/qualificacoes", methods=["GET"])
def listar_qualificacoes() -> Response:
    verify_jwt_in_request()
    with Session(engine) as session:
        stmt = select(Qualificacao)
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

        return jsonify(result)


# 4.3 Listar qualificações válidas para um tipo de tripulante
@v2.route("/qualificacoes/<id>", methods=["DELETE"])
def apagar_qualificacao(id: int) -> Response:
    with Session(engine) as session:
        stmt = select(Qualificacao).where(Qualificacao.id == id)
        qualificacao = session.execute(stmt).scalar_one_or_none()
        if not qualificacao:
            abort(404, "Qualificação não encontrada")

        session.delete(qualificacao)
        session.commit()
        return jsonify({"mensagem": "Qualificação apagada com sucesso."})


# 5. Associar qualificação a um tripulante (com validação)
@v2.route("/tripulante/<int:tripulante_id>/qualificacoes", methods=["POST"])
def adicionar_qualificacao_tripulante(tripulante_id: int) -> tuple[Response, int]:
    data = request.get_json()
    with Session(engine) as session:
        tripulante = session.get(Tripulante, tripulante_id)
        if not tripulante:
            abort(404, "Tripulante não encontrado")

        qualificacao = session.get(Qualificacao, data["qualificacao_id"])
        if not qualificacao:
            abort(404, "Qualificação não encontrada")

        # Validação simplificada
        if tripulante.tipo != qualificacao.tipo_aplicavel:
            return jsonify({"erro": "Esta qualificação não é válida para o tipo de tripulante"}), 400

        pq = TripulanteQualificacao(
            tripulante_id=tripulante.nip,
            qualificacao_id=qualificacao.id,
            data_ultima_validacao=datetime.strptime(data["data_ultima_validacao"], "%Y-%m-%d").date(),
        )
        session.add(pq)
        session.commit()
        return jsonify({"id": pq.id}), 200


# 6. Listar qualificações com validade de um tripulante
@v2.route("/tripulante/<int:tripulante_id>/qualificacoes", methods=["GET"])
def listar_qualificacoes_tripulante(tripulante_id: int) -> Response:
    with Session(engine) as session:
        tripulante = session.get(Tripulante, tripulante_id)
        if not tripulante:
            abort(404, "Tripulante não encontrado")

        stmt = (
            select(TripulanteQualificacao)
            .where(TripulanteQualificacao.tripulante_id == tripulante.nip)
            .join(TripulanteQualificacao.qualificacao)
        )
        resultados = session.execute(stmt).scalars().all()

        # Montar o JSON agrupado por grupo
        qualificacoes_por_grupo: dict[str, list[dict]] = {}
        for pq in resultados:
            grupo = pq.qualificacao.grupo.value
            if grupo not in qualificacoes_por_grupo:
                qualificacoes_por_grupo[grupo] = []
            qualificacoes_por_grupo[grupo].append(
                {
                    "id": pq.qualificacao.id,
                    "nome": pq.qualificacao.nome,
                    "tipo_aplicavel": pq.qualificacao.tipo_aplicavel.value,
                    "validade": pq.qualificacao.validade,
                    "data_ultima_validacao": pq.data_ultima_validacao.isoformat(),
                }
            )

        return jsonify(
            {
                "tripulante": {
                    "nip": tripulante.nip,
                    "nome": tripulante.nome,
                    "tipo": tripulante.tipo.value,
                },
                "qualificacoes": qualificacoes_por_grupo,
            }
        )


@v2.route(
    "/tripulante/<int:tripulante_id>/qualificacoes/<int:qualificacao_id>",
    methods=["PUT"],
)
def atualizar_data_qualificacao(tripulante_id: int, qualificacao_id: int):
    data: dict = request.get_json()
    with Session(engine) as session:
        pq = session.scalars(
            select(TripulanteQualificacao).where(
                TripulanteQualificacao.tripulante_id == tripulante_id,
                TripulanteQualificacao.qualificacao_id == qualificacao_id,
            )
        ).first()
        if not pq:
            abort(404, "Qualificação não atribuída ao tripulante")

        pq.data_ultima_validacao = datetime.strptime(data["data_ultima_validacao"], "%Y-%m-%d").date()
        session.commit()
        return jsonify({"mensagem": "Qualificação atualizada com sucesso"}), 200


@v2.route(
    "/tripulante/<int:tripulante_id>/qualificacoes/<int:qualificacao_id>",
    methods=["DELETE"],
)
def remover_qualificacao_tripulante(tripulante_id, qualificacao_id):
    with Session(engine) as session:
        pq = session.scalars(
            select(TripulanteQualificacao).where(
                TripulanteQualificacao.tripulante_id == tripulante_id,
                TripulanteQualificacao.qualificacao_id == qualificacao_id,
            )
        ).first()
        if not pq:
            abort(404, "Qualificação não atribuída ao tripulante")

        session.delete(pq)
        session.commit()
        return jsonify({"mensagem": "Qualificação removida com sucesso"})


@v2.route("/qualificacoes/expiradas", methods=["GET"])
def listar_qualificacoes_expiradas():
    hoje = datetime.utcnow().date()
    with Session(engine) as session:
        pq_list = session.scalars(
            select(TripulanteQualificacao).options(
                selectinload(TripulanteQualificacao.tripulante),
                selectinload(TripulanteQualificacao.qualificacao),
            )
        ).all()

        resultado = [
            {
                "tripulante_id": pq.tripulante.nip,
                "tripulante_nome": pq.tripulante.nome,
                "tripulante_tipo": pq.tripulante.tipo.value,
                "qualificacao": pq.qualificacao.nome,
                "expirou_em": pq.data_expiracao().isoformat(),
            }
            for pq in pq_list
            if pq.data_expiracao() < hoje
        ]
        return jsonify(resultado)


@v2.route("/tripulante/<int:tripulante_id>/qualificacoes/expiradas", methods=["GET"])
def listar_qualificacoes_expiradas_por_tripulante(tripulante_id):
    hoje = datetime.now(datetime.UTC).date()
    with Session(engine) as session:
        tripulante = session.scalars(
            select(Tripulante)
            .options(selectinload(Tripulante.qualificacoes).selectinload(TripulanteQualificacao.qualificacao))
            .where(Tripulante.nip == tripulante_id)
        ).first()

        if not tripulante:
            abort(404, "Tripulante não encontrado")

        resultado = [
            {
                "qualificacao": pq.qualificacao.nome,
                "expirou_em": pq.data_expiracao().isoformat(),
            }
            for pq in tripulante.qualificacoes
            if pq.data_expiracao() < hoje
        ]
        return jsonify(resultado)


@v2.route("/listas", methods=["GET"])
def listar_tipos_e_grupos():
    print("Getting LISTs")
    print(
        {
            "tipos": [t.value for t in TipoTripulante],
            "grupos": [g.value for g in GrupoQualificacoes],
        }
    )
    return jsonify(
        {
            "tipos": [t.value for t in TipoTripulante],
            "grupos": [g.value for g in GrupoQualificacoes],
        }
    ), 200
