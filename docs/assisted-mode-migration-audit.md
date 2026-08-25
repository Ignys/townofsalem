# Auditoria de migração para o modo presencial assistido

## Arquitetura encontrada

O projeto já separava estado público, roster público e `privatePlayers`, possuía autenticação anônima, reconexão, sorteio privado de roles, timer baseado em timestamp absoluto e módulos puros de votação. A interface ativa, porém, ainda usava a máquina linear de fases e exibia votação de acusação e veredito aos jogadores.

## Classificação

| Área | Decisão | Observação |
| --- | --- | --- |
| Máquina linear e `canTransition` | DESATIVAR NO MODO PRINCIPAL | Preservada apenas como módulo isolado para um possível modo automatizado. |
| Controle de fase do host | ADAPTAR | Substituído por seleção livre e criação de `PhaseSession`. |
| Timer absoluto, pausa, retomada, +30s e encerramento | REUTILIZAR | Integrado ao início atômico de cada fase. |
| Alive/dead | REUTILIZAR | Continua administrativo e disponível a jogadores mortos sem revelar terceiros. |
| Acusação, Trial e veredito digitais | DESATIVAR NO MODO PRINCIPAL | Código puro permanece isolado; componentes não são renderizados no fluxo principal. |
| Paths legados `actions` e `votes` | ADAPTAR | Preservados e fechados para escrita de jogador. |
| Interface do jogador | ADAPTAR | Limitada a role própria, objetivo, explicações, fase e timer. |
| Catálogo de roles | ADAPTAR | Passa a declarar despertar, ação, targeting, prioridade e efeito quando confirmados. |

## Limites de segurança

- Jogadores leem `public`, o próprio registro público e o próprio `privatePlayer`.
- O roster privado, as sessões, o Action Log, notas, resoluções e Event History administrativo são host-only.
- O host autenticado é verificado pelo UID persistido da partida; nenhuma flag local concede autoridade.
- Action Log editável e Event History append-only são estruturas distintas.

## Arquivos-base da migração

- `src/types/game.ts`, `src/types/session.ts` e `src/types/role.ts`
- `src/features/game-state/phase-definitions.ts`
- `src/features/game-state/start-host-phase.ts`
- `src/features/night-actions/`
- `src/lib/firebase/schema.ts` e `src/lib/firebase/paths.ts`
- `database.rules.json` e `docs/firebase-schema.md`

