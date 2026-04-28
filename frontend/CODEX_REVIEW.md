# Codex Frontend Review — SIQ 2.0 React 19

> Análise estática ao frontend React 19 + Chakra UI v3 + TanStack Query.
> Data: 2026-04-28. Gerada por `codex:rescue` sobre os ficheiros completos em `frontend/src/`.
>
> **Nota de estrutura:** o projecto não usa `src/pages/` nem `src/hooks/` na raiz;
> a organização equivalente está em `src/features/**/pages`, `src/features/**/hooks` e `src/shared/hooks`.

---

## Plano de Refactor — por impacto e ordem de execução

### Fase 1 — Arquitectura (impacto crítico, fazer primeiro)

#### 1.1 Code-splitting com `React.lazy` + `Suspense`

**Ficheiros alvo:**

- `src/app/router/protected.routes.jsx` — todas as páginas importadas no topo sem lazy
- `src/app/providers/AppProviders.jsx:34` — sem `Suspense` boundary à volta do router

**O que fazer:**

```jsx
// Antes
import FlightsPage from "@/features/flights/pages/FlightsPage";

// Depois
const FlightsPage = React.lazy(
  () => import("@/features/flights/pages/FlightsPage"),
);
```

Adicionar um `<Suspense fallback={<PageSpinner />}>` em `AppProviders.jsx` a envolver o router.

**Impacto:** reduz bundle inicial e melhora TTI em todas as páginas autenticadas.

---

#### 1.2 Mover fetches para `services/` ou hooks de feature

**Ficheiros alvo:**

- `src/features/qualifications/components/CreateQualModal.jsx:104` — `http.get` directo no componente (linhas 114, 135, 151)
- `src/shared/utils/useSunTimes.jsx:17` — `fetch` directo no hook utilitário
- `src/utils/useSendEmail.jsx:23` — `axios.post` directo no hook

**O que fazer:** extrair cada chamada HTTP para um hook de query TanStack ou para um ficheiro `src/features/<feature>/api/<feature>.api.js`.

---

#### 1.3 Decomposição dos componentes gigantes

| Componente                   | Linhas | Responsabilidades misturadas                                                                             |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `CreateFlightModal.jsx`      | 688    | formulário, react-hook-form, cálculo de horas, fetch utilizadores, fetch anomalias, scroll, serialização |
| `CreateQualModal.jsx`        | 442    | fetch, fallback logic, estado de modal, formulário                                                       |
| `QualificationTablePage.jsx` | >350   | derivação, ordenação, filtragem, cor semântica, tabela                                                   |

**Estratégia:**

1. Extrair lógica de negócio e fetch para `useCreateFlightForm.js`, `useCreateQualForm.js`, etc.
2. Dividir o JSX em sub-componentes (`<FlightPilotsSection>`, `<FlightHoursSection>`).
3. Manter o componente raiz como composição pura.

---

### Fase 2 — Bugs e correctness (fazer antes de qualquer feature nova)

#### 2.1 Bug em `useSendEmail`

**Ficheiro:** `src/utils/useSendEmail.jsx`

```js
// Linha 11 — destrói o setter, não o state
const [setLoading] = useState(true); // ← ERRADO: guarda o valor (true), não o setter

// Linhas 21 e 46 — chama o valor booleano como função → TypeError em runtime
setLoading(false);
```

**Fix:**

```js
const [loading, setLoading] = useState(false);
```

#### 2.2 Import morto em `UsersTable`

**Ficheiro:** `src/features/users/components/UsersTable.jsx:11`

`sendEmail` é importado e criado mas nunca usado. Remover o import e a chamada ao hook.

---

### Fase 3 — Performance (depois da arquitectura estar limpa)

#### 3.1 Corrigir `staleTime: 0` em `useUsersQuery`

**Ficheiro:** `src/features/users/queries/useUsersQuery.js:19`

`staleTime: 0` anula o default global de 5 minutos, forçando refetch em todos os mounts da tabela de utilizadores.

**Fix:** remover a opção (herda o global) ou alinhar com `staleTime: 5 * 60 * 1000`.

**Nota:** `useDashboardStats` e `usePilots` já têm `staleTime` correcto; o problema de refetch não existe no dashboard.

#### 3.2 Virtualização das listagens restantes

A listagem principal de voos já está virtualizada (`FlightsPage.jsx:117`). Falta:

| Componente                        | Problema                                             |
| --------------------------------- | ---------------------------------------------------- |
| `PilotsPage.jsx:22`               | `SimpleGrid` com `.map()` sobre todos os tripulantes |
| `QualificationTablePage.jsx:356`  | tabela grande sem virtualização                      |
| `UsersTable.jsx:31`               | render total da tabela                               |
| `FlightsByCrewSearchPage.jsx:175` | pesquisa de voos por tripulante sem virtualização    |

**Solução recomendada:** `@tanstack/react-virtual` (já no ecossistema TanStack usado no projecto).

---

### Fase 4 — Chakra UI v3 e tokens de tema (pode ser faseado)

#### 4.1 Props legadas de Chakra v2

| Prop legada          | Ficheiro                                                 | Fix v3                               |
| -------------------- | -------------------------------------------------------- | ------------------------------------ |
| `variant="simple"`   | `UsersTable.jsx:17`                                      | remover ou usar variant v3           |
| `isTruncated`        | `QualificationTablePage.jsx:330`, `:379`                 | `truncate` (prop v3)                 |
| `leftIcon` em Button | `CreateFlightModal.jsx:602`                              | slot `<Button><Icon/>texto</Button>` |
| `spacing` legado     | `ErrorBoundary.jsx:39`, `FlightsByCrewSearchPage.jsx:68` | `gap`                                |

#### 4.2 Cores hardcoded em vez de semantic tokens

**Ficheiros mais afectados:**

- `FlightsByCrewSearchPage.jsx:86` — `gray.700`, `teal.500`, `orange.400`, `red.400`
- `ErrorBoundary.jsx:41` — `red.500`
- `CreateFlightModal.jsx:534` — `teal.400`

**Fix:** mapear para semantic tokens do tema (`fg.error`, `fg.warning`, etc.) definidos em `src/app/theme/`.

#### 4.3 Coordenadas hardcoded em `useSunTimes`

**Ficheiro:** `src/shared/utils/useSunTimes.jsx:3`

Coordenadas e endpoint fixos no hook. Mover para constantes de configuração ou para variáveis de ambiente.

---

## Resumo de prioridades

| #   | Item                                 | Impacto | Esforço     | Ficheiros principais                                                            |
| --- | ------------------------------------ | ------- | ----------- | ------------------------------------------------------------------------------- |
| 1   | Bug `useSendEmail` (useState errado) | Crítico | Muito baixo | `useSendEmail.jsx`                                                              |
| 2   | Code-splitting (`React.lazy`)        | Alto    | Baixo       | `protected.routes.jsx`, `AppProviders.jsx`                                      |
| 3   | Fetches fora de services             | Alto    | Médio       | `CreateQualModal.jsx`, `useSunTimes.jsx`, `useSendEmail.jsx`                    |
| 4   | `staleTime: 0` em `useUsersQuery`    | Alto    | Muito baixo | `useUsersQuery.js`                                                              |
| 5   | Decomposição `CreateFlightModal`     | Médio   | Alto        | `CreateFlightModal.jsx`                                                         |
| 6   | Decomposição `CreateQualModal`       | Médio   | Médio       | `CreateQualModal.jsx`                                                           |
| 7   | Virtualização listagens              | Médio   | Médio       | `PilotsPage`, `QualificationTablePage`, `UsersTable`, `FlightsByCrewSearchPage` |
| 8   | Import morto `UsersTable`            | Baixo   | Muito baixo | `UsersTable.jsx`                                                                |
| 9   | Migração props Chakra v2→v3          | Baixo   | Médio       | vários                                                                          |
| 10  | Semantic tokens (cores hardcoded)    | Baixo   | Médio       | vários                                                                          |

> Análise estática; não foram executados benchmarks de bundle nem profiling de render.
