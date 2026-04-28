# Codex Backend Review — SIQ 2.0 Flask API

> Análise estática ao backend Flask 3.1. Data: 2026-04-28.
> Gerada por `codex:rescue` sobre os ficheiros completos em `api/app/`.

---

## 1. Rotas sem autenticação

Algumas rotas expõem dados sensíveis sem qualquer decorador JWT ou de permissão.

- **Exportação de utilizadores** — `users/routes.py:387`: exporta dados de utilizadores sem `JWT` nem `@require_permission`.
- **Rotas públicas em qualificações** — `qualifications/routes.py:288`, `:340`, `:493`: acessíveis sem autenticação.

**Acção:** adicionar `@require_authenticated()` (no mínimo) ou `@require_permission(...)` a cada uma dessas rotas.

---

## 2. RBAC incompleto

A app já tem `require_permission()` em `shared/permissions.py:132`, mas várias rotas continuam a usar só `require_authenticated()` ou `require_role()`, impedindo enforcement explícito de strings de permissão.

| Rota | Ficheiro | Problema |
|------|----------|----------|
| Dashboard | `dashboard/routes.py:17` | só `require_authenticated` |
| Criar/editar qualificação | `qualifications/routes.py:67`, `:142` | só `require_role` |
| Listar utilizadores | `users/routes.py:34` | só `require_role` |
| Mutações de voos | `flights/routes.py:147` | sem `flights.write` explícito |

**Acção:** substituir `require_role(Role.X)` por `@require_permission("flights.read")` / `"flights.write"` / `"qualifications.write"` conforme aplicável.

---

## 3. N+1 no create/update de voos

O caminho de criação e edição de voos ainda provoca N+1 sobre `TripulanteQualificacao` e `Qualificacao`.

- `flights/service.py:676` — por cada tripulante dispara até 10 chamadas a `_update_tripulante_qualificacao()`.
- `flights/repository.py:392` — `SELECT` por qualificação individual dentro do loop.
- `flights/repository.py:345` — lookup extra para landing quals.
- `flights/repository.py:424`, `:436` — `flush()` por linha.

O reprocessamento já tem uma versão cacheada em `flights/service.py:697`; create/update deviam reutilizar essa abordagem (batch upsert + flush único no fim).

---

## 4. Listagens sem paginação obrigatória

Se o cliente não enviar `page`/`per_page`, o dataset inteiro é carregado em memória.

| Endpoint | Rota | Repositório |
|----------|------|-------------|
| Voos | `flights/routes.py:47` | `flights/repository.py:26` (`.all()`) |
| Utilizadores | `users/routes.py:125` | `users/repository.py:14` (`.all()`) |
| Tripulantes por tipo | `qualifications/routes.py:275` | `qualifications/repository.py:137` (`.all()`) |

**Acção:** tornar `page` e `per_page` obrigatórios (ou aplicar defaults + limite máximo) e usar `.paginate()` no repositório.

---

## 5. Cálculo de validades em Python

O cálculo de `remaining_days` e ordenação por grupo é feito em Python depois de trazer os registos da BD.

- `users/models.py:152` — propriedade `status` calculada em Python.
- `qualifications_preview/service.py:35` — ranking e ordenação em memória.
- `qualifications_preview/repository.py:47` — só filtra por expiração em SQL; `remaining_days` e `row_number()` ficam de fora.

**Próximo passo:** projectar `expiry_date`, `remaining_days` e `ROW_NUMBER() OVER (PARTITION BY qualificacao_id ORDER BY remaining_days)` directamente no SQL para reduzir transferência de dados e simplificar o código Python.

---

## 6. Índices em falta

Os índices recomendados com base no schema real (nomes de tabelas e colunas verificados):

```python
# Alembic — adicionar a uma nova revisão
op.create_index(
    "ix_flights_table_date",
    "flights_table",
    ["date"],
    unique=False,
)
op.create_index(
    "ix_tripulante_qualificacoes_data_ultima_validacao",
    "tripulante_qualificacoes",
    ["data_ultima_validacao"],
    unique=False,
)
op.create_index(
    "ix_flight_pilots_pilot_id",
    "flight_pilots",
    ["pilot_id"],
    unique=False,
)
# Opcional — ROI menor que os anteriores
op.create_index(
    "ix_qualificacoes_validade",
    "qualificacoes",
    ["validade"],
    unique=False,
)
```

> **Nota:** `Flight` não tem `tripulante_id` — o join real usa `flight_pilots.pilot_id` (`flights/models.py:120`).
> `TripulanteQualificacao` não tem `validade` — a coluna temporal usada nas queries é `data_ultima_validacao` (`users/models.py:147`).
> `tripulante_qualificacoes.tripulante_id` já está coberto pelo `UniqueConstraint(tripulante_id, qualificacao_id)` (`users/models.py:142`).

---

## 7. Lógica de negócio nos controllers

Lógica que devia viver em `service.py` está nos controllers.

- `users/routes.py:158`, `:261`, `:299` — matriz de autorização e atribuição de `roleLevel` duplicada nas rotas.
- `dashboard/routes.py:82`, `:98` — parsing de intervalo de datas e tuning de `statement_timeout` directamente no controller.

**Acção:** mover estas responsabilidades para `users/service.py` e `dashboard/service.py` respectivamente.

---

## Prioridade sugerida

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 1 | Rotas sem autenticação | Crítico | Baixo |
| 2 | RBAC incompleto | Alto | Médio |
| 3 | Índices em falta | Alto | Baixo |
| 4 | N+1 no create/update | Médio | Alto |
| 5 | Paginação obrigatória | Médio | Médio |
| 6 | Validades em SQL | Baixo | Alto |
| 7 | Lógica nos controllers | Baixo | Médio |

> Análise estática; não foram executados `EXPLAIN ANALYZE` nem benchmarks.
