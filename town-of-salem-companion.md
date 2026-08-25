# Town of Salem Board Game Companion

> Direção vigente: modo presencial assistido. O site não substitui a conversa da mesa. Jogadores consultam somente a própria role e o timer/fase; não enviam votos ou ações no fluxo principal. O mestre registra as decisões comunicadas presencialmente e é a fonte operacional de verdade.

## 1. Visão geral

O **Town of Salem Board Game Companion** é um web app/PWA criado para auxiliar partidas presenciais de *Town of Salem Board Game*.

O aplicativo **não substitui o jogo físico**. Seu objetivo é atuar como um companion digital para:

- reduzir o trabalho manual do mestre;
- automatizar cálculos e interações entre roles;
- controlar fases, timers e votações;
- melhorar o balanceamento das partidas;
- realizar sorteio secreto de roles;
- ajudar jogadores iniciantes a entenderem sua role;
- permitir que cada jogador use o próprio celular durante a partida;
- manter informações secretas protegidas entre os jogadores.

---

# 2. Objetivos do projeto

## 2.1. Para o mestre

O mestre deve conseguir:

- criar uma partida;
- gerar um código de sala e QR Code;
- visualizar os jogadores conectados;
- escolher ou gerar automaticamente uma composição de roles;
- sortear as roles entre os jogadores;
- controlar jogadores vivos e mortos;
- controlar as fases da partida;
- iniciar e controlar timers;
- receber ações noturnas;
- calcular interações entre roles;
- resolver automaticamente a noite;
- controlar votações;
- calcular quantos votos são necessários;
- verificar condições de vitória;
- visualizar um histórico dos eventos da partida.

## 2.2. Para os jogadores

Cada jogador deve conseguir:

- entrar em uma sala usando código ou QR Code;
- escolher um nome;
- receber sua role secretamente;
- visualizar o objetivo da role;
- visualizar suas habilidades;
- visualizar explicações simplificadas da role;
- receber instruções específicas para cada fase;
- enviar ações noturnas quando necessário;
- participar de votações pelo celular;
- acompanhar o timer da fase atual;
- saber se está vivo ou morto.

---

# 3. Escopo inicial

O projeto deve ser desenvolvido em etapas.

A prioridade inicial é criar um **MVP jogável** antes de implementar todas as regras e roles do jogo.

---

# 4. MVP 1 — Lobby e sorteio de roles

A primeira versão deve permitir:

1. Mestre cria uma partida.
2. Sistema gera um código de sala curto.
3. Sistema gera um QR Code da partida.
4. Jogadores entram usando o código ou QR Code.
5. Jogadores informam um nome.
6. Mestre visualiza os jogadores conectados.
7. Mestre escolhe as roles da partida.
8. Sistema valida se a quantidade de roles corresponde à quantidade de jogadores.
9. Mestre inicia o sorteio.
10. Sistema embaralha jogadores e roles.
11. Cada jogador recebe somente sua própria role.
12. Jogador pode abrir uma página explicando sua role.

### Critérios de aceitação

- nenhum jogador pode visualizar a role de outro jogador;
- o mestre pode visualizar todas as roles;
- ao atualizar a página, o jogador deve continuar reconhecido;
- jogadores devem aparecer no lobby em tempo real;
- não deve ser necessário criar conta com email e senha.

---

# 5. MVP 2 — Fases e timers

Adicionar controle das principais fases da partida:

- Lobby
- Day
- Discussion
- Trial
- Defense
- Voting
- Night
- Game Over

O mestre deve conseguir iniciar, pausar, aumentar ou finalizar timers.

Exemplo:

```text
DISCUSSÃO

02:14

[ +30s ]
[ Pausar ]
[ Encerrar ]
```

Configurações possíveis:

```text
Discussão: 3 minutos
Defesa: 30 segundos
Votação: 30 segundos
Noite: 60 segundos
```

O timer deve ser sincronizado usando um timestamp de término, e não decrementado individualmente em cada navegador.

Exemplo:

```ts
phaseEndsAt = Date.now() + duration
```

Cada cliente calcula localmente:

```ts
remaining = phaseEndsAt - Date.now()
```

---

# 6. MVP 3 — Votação

Durante o dia, jogadores vivos devem poder votar.

O sistema deve:

- impedir jogador morto de votar;
- impedir votos duplicados;
- permitir trocar o voto enquanto a votação estiver aberta;
- calcular votos necessários automaticamente;
- iniciar julgamento quando o limite for atingido;
- permitir votação Guilty / Innocent / Abstain;
- calcular o resultado final.

Exemplo:

```text
Acusado: Pedro

Votos necessários: 5

Daniel    ✓
Lucas     ✓
João      ✗
Mateus    ✓
Ana       ✓
Maria     ✗
Felipe    ✓

5 / 5

JULGAMENTO INICIADO
```

---

# 7. MVP 4 — Ações noturnas

Cada role que possui ação noturna deve receber uma interface adequada.

Exemplo — Doctor:

```text
NOITE 3

Escolha alguém para proteger:

○ Daniel
○ Lucas
○ Pedro
○ Ana

[ Confirmar ]
```

Exemplo — Sheriff:

```text
NOITE 3

Quem você deseja investigar?

○ Daniel
○ Lucas
○ Pedro
○ Ana

[ Investigar ]
```

As ações devem ser enviadas ao servidor e ficar ocultas para outros jogadores.

O mestre deve conseguir visualizar todas as ações recebidas.

---

# 8. MVP 5 — Game Engine

Criar um motor independente responsável pelas regras do jogo.

O Game Engine não deve depender diretamente do React, Next.js ou Firebase.

Estrutura sugerida:

```text
src/
  game-engine/
    roles/
    actions/
    attack.ts
    defense.ts
    roleblock.ts
    targeting.ts
    priority.ts
    resolve-night.ts
    win-condition.ts
    voting.ts
    types.ts
```

A interface principal deve ser baseada em funções puras sempre que possível.

Exemplo:

```ts
const result = resolveNight(gameState, actions)
```

Entrada:

```ts
{
  players,
  actions,
  roles,
  currentNight
}
```

Saída:

```ts
{
  deaths: [],
  protections: [],
  roleblocks: [],
  investigations: [],
  messages: [],
  events: []
}
```

---

# 9. Sistema de ataque e defesa

Padronizar os níveis de ataque e defesa.

Exemplo:

```ts
type AttackLevel =
  | "none"
  | "basic"
  | "powerful"
  | "unstoppable"

type DefenseLevel =
  | "none"
  | "basic"
  | "powerful"
  | "invincible"
```

Criar uma função central:

```ts
canKill(attacker, target, context)
```

Exemplo de retorno:

```ts
{
  success: false,
  reason: "Basic Attack does not penetrate Basic Defense"
}
```

---

# 10. Ordem de resolução das ações

As ações noturnas precisam possuir prioridade.

Nunca depender da ordem em que os jogadores enviaram as ações.

Exemplo conceitual:

```ts
enum ActionPriority {
  Roleblock = 10,
  Redirect = 20,
  Protect = 30,
  Investigate = 40,
  Attack = 50,
  PostAttack = 60
}
```

Fluxo sugerido:

```text
Receber ações
      ↓
Validar ações
      ↓
Aplicar roleblocks
      ↓
Aplicar redirects
      ↓
Aplicar proteções
      ↓
Aplicar ataques
      ↓
Aplicar investigações
      ↓
Aplicar efeitos posteriores
      ↓
Determinar mortes
      ↓
Verificar condições de vitória
```

A prioridade real deve ser baseada nas regras oficiais da versão física utilizada.

---

# 11. Calculadora de interação

Criar uma ferramenta disponível para o mestre.

Objetivo:

> responder rapidamente perguntas como “essa pessoa pode morrer para essa ação?”

Exemplo:

```text
Atacante
[Mafioso]

Alvo
[Serial Killer]

Ação
[Attack]

Resultado

❌ O alvo não morre.

Motivo:
Basic Attack não atravessa Basic Defense.
```

Esta calculadora deve utilizar o mesmo Game Engine da partida.

Nunca duplicar regras em componentes de UI.

---

# 12. Condições de vitória

Criar um módulo exclusivo:

```text
win-condition.ts
```

Exemplo:

```ts
checkWinCondition(gameState)
```

Retorno:

```ts
{
  gameOver: true,
  winners: ["town"],
  winningPlayers: ["player1", "player4"]
}
```

As condições devem considerar:

- jogadores vivos;
- facções;
- roles neutras;
- condições especiais de determinadas roles.

---

# 13. Balanceamento de partidas

O mestre deve possuir duas opções.

## Manual

Selecionar todas as roles individualmente.

## Automático

Selecionar um preset baseado na quantidade de jogadores.

Exemplo:

```text
10 jogadores

Town Investigative   2
Town Protective      1
Town Killing         1
Random Town          2

Mafia Killing        1
Mafia Support        1

Neutral Evil         1
Neutral Killing      1
```

Presets possíveis:

- Beginner
- Balanced
- Classic
- Chaos
- Custom

O sistema deve validar composições impossíveis ou potencialmente problemáticas.

---

# 14. Sistema de pontuação de balanceamento

Funcionalidade futura.

Cada role pode possuir um peso aproximado de poder.

Exemplo:

```ts
Sheriff: 2
Investigator: 3
Doctor: 3
Vigilante: 3
Godfather: 4
Mafioso: 3
Consigliere: 2
```

A composição pode receber uma pontuação aproximada.

```text
Town Power: 13
Mafia Power: 9
Neutral Influence: 3

Balance Score: 82%
```

Esse sistema é apenas uma estimativa e deve ser ajustado através de playtests.

---

# 15. Modo iniciante

Cada jogador pode marcar seu nível de experiência.

```text
Experiência

○ Experiente
● Iniciante
```

Jogadores iniciantes recebem explicações maiores.

Exemplo:

```text
VOCÊ É DOCTOR

Facção: Town
Tipo: Town Protective

OBJETIVO
Ajude a Town a eliminar todas as ameaças.

HABILIDADE
Durante a noite você pode escolher uma pessoa para proteger.

Se essa pessoa receber um ataque que sua proteção consiga impedir, ela sobreviverá.

DICA
Tente identificar jogadores importantes para a Town e mantê-los vivos.
```

Jogadores experientes podem receber uma interface reduzida.

---

# 16. Modos da aplicação

## Classic Companion

Celular utilizado apenas para:

- role;
- descrição;
- objetivo;
- timer;
- status da partida.

## Assisted

Adicionar:

- ações noturnas;
- votações;
- resolução de interações;
- ferramentas para o mestre.

## Automated

O aplicativo controla quase toda a lógica da partida:

```text
Night
 ↓
Escolha das ações
 ↓
Resolução automática
 ↓
Day
 ↓
Mortes
 ↓
Discussão
 ↓
Votação
```

Prioridade de desenvolvimento: **Assisted Mode**.

---

# 17. Stack tecnológica

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

## Backend / Realtime

- Firebase Authentication
- Firebase Realtime Database

## Deploy

- Vercel

## Repositório

- GitHub

## Aplicativo mobile

Usar PWA.

Não desenvolver inicialmente:

- React Native;
- Flutter;
- aplicativo nativo Android;
- aplicativo nativo iOS.

---

# 18. Firebase Authentication

Usar autenticação anônima.

Fluxo:

```text
Jogador abre o site
       ↓
Firebase Anonymous Auth
       ↓
Firebase gera UID
       ↓
UID é vinculado ao jogador da partida
```

Não exigir:

- email;
- senha;
- confirmação;
- criação de conta.

---

# 19. Estrutura do Firebase Realtime Database

Estrutura inicial sugerida:

```text
games/
  {gameId}/
    public/
      code
      status
      phase
      day
      phaseEndsAt

    settings/
      hostId
      maxPlayers
      preset

    players/
      {playerId}/
        public/
          name
          alive
          seat

    privatePlayers/
      {playerId}/
        roleId
        faction

    actions/
      {nightNumber}/
        {playerId}/
          actionType
          targetId
          createdAt

    votes/
      {dayNumber}/
        accusations/
        verdicts/

    events/
      {eventId}/
        type
        payload
        createdAt
```

Evitar colocar todos os dados sensíveis em uma única árvore pública.

---

# 20. Segurança

Segurança é uma parte crítica do projeto.

Nunca confiar apenas na interface para esconder informações.

Um jogador não pode conseguir descobrir outras roles usando DevTools ou chamadas diretas ao Firebase.

## Regras básicas

Jogador:

- pode ler dados públicos da sala;
- pode ler seus próprios dados privados;
- pode criar ou editar apenas sua própria ação;
- pode registrar apenas seu próprio voto.

Mestre:

- pode visualizar todas as roles;
- pode visualizar todas as ações;
- pode mudar a fase;
- pode iniciar timers;
- pode matar ou reviver jogadores;
- pode finalizar a partida.

Outros jogadores:

- não podem ler roles privadas;
- não podem ler ações privadas;
- não podem alterar dados de outros jogadores.

---

# 21. Host da partida

O mestre deve possuir um identificador especial.

Exemplo:

```ts
hostUid: string
```

Somente o host pode executar ações administrativas.

Nunca confiar em:

```ts
isHost = true
```

armazenado apenas no cliente.

A autorização precisa ser validada nas regras do Firebase e/ou backend.

---

# 22. Criação da sala

Ao criar uma sala:

1. gerar um `gameId` interno;
2. gerar um código público curto;
3. registrar o UID do host;
4. definir status `lobby`;
5. gerar URL compartilhável;
6. gerar QR Code.

Exemplo:

```text
https://tos.example.com/game/H7K2Q9
```

Código:

```text
H7K2Q9
```

Evitar códigos visualmente ambíguos quando possível:

```text
0 O
1 I L
```

---

# 23. Sorteio das roles

Fluxo:

```text
players = jogadores ativos
roles = roles selecionadas

shuffle(players)
shuffle(roles)

players[i] -> roles[i]
```

O sorteio deve ocorrer no servidor ou em um ambiente confiável.

Não enviar o array completo de roles sorteadas para todos os clientes.

---

# 24. Catálogo de roles

As informações das roles devem ficar separadas do estado das partidas.

Estrutura sugerida:

```text
src/data/roles/
  town/
  mafia/
  neutral/
```

Exemplo:

```ts
interface RoleDefinition {
  id: string
  name: string
  faction: Faction
  alignment: string
  description: string
  beginnerDescription?: string
  goal: string
  attack: AttackLevel
  defense: DefenseLevel
  action?: RoleActionDefinition
  priority?: number
}
```

Exemplo:

```ts
const doctor: RoleDefinition = {
  id: "doctor",
  name: "Doctor",
  faction: "town",
  alignment: "Town Protective",
  description: "Protect one player during the night.",
  beginnerDescription: "Escolha uma pessoa durante a noite para tentar protegê-la de ataques.",
  goal: "Eliminate all threats to the Town.",
  attack: "none",
  defense: "none"
}
```

---

# 25. Estrutura de pastas sugerida

```text
src/
├── app/
│   ├── page.tsx
│   ├── game/
│   │   └── [code]/
│   │       ├── page.tsx
│   │       ├── role/
│   │       ├── night/
│   │       └── vote/
│   │
│   ├── host/
│   │   └── [code]/
│   │       ├── page.tsx
│   │       ├── lobby/
│   │       ├── day/
│   │       ├── night/
│   │       └── settings/
│   │
│   └── roles/
│       └── [slug]/
│
├── components/
│   ├── ui/
│   ├── game/
│   ├── player/
│   └── host/
│
├── features/
│   ├── lobby/
│   ├── roles/
│   ├── voting/
│   ├── timer/
│   ├── night-actions/
│   └── game-state/
│
├── game-engine/
│   ├── actions/
│   ├── roles/
│   ├── attack.ts
│   ├── defense.ts
│   ├── priority.ts
│   ├── resolve-night.ts
│   ├── win-condition.ts
│   └── types.ts
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── database.ts
│   └── utils/
│
├── data/
│   └── roles/
│
└── types/
```

---

# 26. Estados da partida

Criar enum centralizado.

```ts
type GamePhase =
  | "lobby"
  | "day"
  | "discussion"
  | "trial"
  | "defense"
  | "verdict"
  | "night"
  | "game-over"
```

Evitar strings espalhadas pelo projeto.

---

# 27. Estado do jogador

Exemplo:

```ts
interface Player {
  id: string
  uid: string
  name: string
  seat?: number
  alive: boolean
  disconnected: boolean
  experience: "beginner" | "experienced"
}
```

Dados privados separados:

```ts
interface PrivatePlayerState {
  playerId: string
  roleId: string
  faction: string
  statuses: PlayerStatus[]
}
```

---

# 28. Eventos da partida

Utilizar um log de eventos facilita debugging e histórico.

Exemplos:

```text
PLAYER_JOINED
GAME_STARTED
ROLE_ASSIGNED
PHASE_CHANGED
ACTION_SUBMITTED
PLAYER_ROLEBLOCKED
PLAYER_ATTACKED
PLAYER_PROTECTED
PLAYER_DIED
TRIAL_STARTED
PLAYER_EXECUTED
GAME_ENDED
```

Exemplo:

```ts
interface GameEvent {
  id: string
  gameId: string
  type: GameEventType
  timestamp: number
  payload: unknown
}
```

---

# 29. Interface do mestre

A dashboard do mestre deve apresentar prioritariamente:

```text
PARTIDA H7K2Q9
Dia 3
Fase: Night

Jogadores vivos: 7 / 10

[ Timer ]
[ Avançar fase ]

JOGADORES

Daniel      Doctor       Vivo
Lucas       Sheriff      Vivo
Pedro       Mafioso      Vivo
Ana         Jester       Morta

AÇÕES DA NOITE

Doctor → Lucas
Sheriff → Pedro
Mafioso → Lucas

[ Resolver noite ]
```

---

# 30. Interface do jogador

Prioridades:

- mobile first;
- poucos botões;
- textos grandes;
- informações importantes imediatamente visíveis;
- evitar menus complexos durante a partida.

Exemplo:

```text
DOCTOR
Town Protective

Você está vivo.

NOITE 3

Escolha uma pessoa para proteger.

[ Lucas ]
[ Pedro ]
[ Ana ]
[ Rafael ]

[ Confirmar ]
```

---

# 31. PWA

O projeto deve funcionar como Progressive Web App.

Objetivos:

- permitir adicionar à tela inicial;
- abrir em modo standalone;
- carregar rapidamente;
- possuir ícone próprio;
- possuir manifest;
- oferecer comportamento semelhante a aplicativo mobile.

Offline completo não é prioridade, pois as partidas dependem de sincronização em tempo real.

---

# 32. Testes

O Game Engine precisa possuir testes automatizados.

Exemplo:

```ts
test("Doctor prevents a valid Mafioso attack", () => {
  const result = resolveNight(state, actions)

  expect(result.deaths).not.toContain("target-player")
})
```

Criar testes principalmente para:

- ataque vs defesa;
- roleblock;
- proteção;
- redirects;
- imunidades;
- investigações;
- múltiplos ataques;
- prioridades;
- empate de votação;
- condições de vitória.

Cada bug de regra encontrado durante playtest deve virar um novo teste.

---

# 33. Princípios técnicos

## Regra 1

A interface não deve conter lógica de regras complexas.

Errado:

```ts
if (role === "doctor" && attacker === "mafioso") {
  // ...
}
```

Correto:

```ts
resolveAttack(context)
```

## Regra 2

Toda regra do jogo deve possuir uma única fonte de verdade.

## Regra 3

Nunca confiar em dados enviados pelo cliente.

## Regra 4

Nunca enviar informações secretas desnecessárias ao navegador.

## Regra 5

Game Engine deve ser testável sem Firebase.

---

# 34. Roadmap

## Fase 1

- [ ] Criar projeto Next.js
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind
- [ ] Criar projeto Firebase
- [ ] Configurar Anonymous Authentication
- [ ] Configurar Realtime Database
- [ ] Criar regras iniciais de segurança

## Fase 2

- [ ] Criar tela inicial
- [ ] Criar sala
- [ ] Entrar em sala
- [ ] Criar nickname
- [ ] Lobby realtime
- [ ] Host dashboard básica
- [ ] QR Code

## Fase 3

- [ ] Criar catálogo inicial de roles
- [ ] Seleção manual de roles
- [ ] Validação de quantidade
- [ ] Sorteio automático
- [ ] Tela privada de role
- [ ] Modo iniciante

## Fase 4

- [ ] Estados da partida
- [ ] Controle de fases
- [ ] Timer sincronizado
- [ ] Jogador vivo/morto

## Fase 5

- [ ] Sistema de votação
- [ ] Trial
- [ ] Guilty / Innocent / Abstain
- [ ] Resultado automático

## Fase 6

- [ ] Ações noturnas
- [ ] Target selection
- [ ] Dashboard de ações do mestre

## Fase 7

- [ ] Attack system
- [ ] Defense system
- [ ] Roleblock
- [ ] Protection
- [ ] Priority system
- [ ] Night resolver

## Fase 8

- [ ] Condições de vitória
- [ ] Histórico de eventos
- [ ] Game over

## Fase 9

- [ ] Presets de composição
- [ ] Balanceamento automático
- [ ] Calculadora de interações

## Fase 10

- [ ] PWA
- [ ] Melhorias mobile
- [ ] Animações
- [ ] Sons opcionais
- [ ] Playtests
- [ ] Ajustes de UX

---

# 35. Fora do escopo inicial

Não desenvolver no MVP:

- chat de texto;
- voz;
- matchmaking online;
- partidas completamente remotas;
- ranking global;
- contas permanentes;
- sistema social;
- monetização;
- aplicativo nativo;
- todas as roles existentes de uma vez.

---

# 36. Estratégia de implementação das roles

Não implementar todas as roles simultaneamente.

Criar primeiro um conjunto pequeno e previsível.

Exemplo inicial:

### Town

- Sheriff
- Doctor
- Investigator
- Vigilante

### Mafia

- Godfather
- Mafioso
- Consigliere

### Neutral

- Jester
- Serial Killer

Após o Game Engine estar estável, adicionar novas roles progressivamente.

---

# 37. Ambiente de desenvolvimento

Variáveis esperadas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

As credenciais públicas do Firebase Web SDK não devem ser tratadas como segredo.

A segurança da aplicação deve depender das Firebase Security Rules e das validações apropriadas.

---

# 38. Definição de pronto para o primeiro playtest

O primeiro playtest pode acontecer quando:

- [ ] mestre consegue criar sala;
- [ ] jogadores conseguem entrar pelo celular;
- [ ] lobby atualiza em tempo real;
- [ ] mestre consegue selecionar roles;
- [ ] roles são sorteadas corretamente;
- [ ] cada jogador vê somente sua própria role;
- [ ] mestre vê todas as roles;
- [ ] atualização da página não remove o jogador da partida;
- [ ] mestre consegue iniciar Day e Night;
- [ ] timer funciona para todos;
- [ ] mestre consegue marcar jogador como morto;
- [ ] jogadores mortos recebem estado visual correto.

O Game Engine automático não é necessário para o primeiro playtest.

---

# 39. Prioridade geral

A ordem de prioridade do projeto deve ser:

```text
Jogável
  ↓
Seguro
  ↓
Confiável
  ↓
Fácil de usar
  ↓
Automático
  ↓
Bonito
```

Evitar investir excessivamente em design antes que o fluxo principal da partida esteja funcional.

---

# 40. Resumo da arquitetura

```text
                        VERCEL
                           │
                     Next.js PWA
                           │
          ┌────────────────┴────────────────┐
          │                                 │
 Firebase Anonymous Auth          Firebase Realtime DB
          │                                 │
        UID                              Game State
                                            │
                      ┌─────────────────────┼─────────────────────┐
                      │                     │                     │
                   Players               Actions               Votes
                      │
                 Private Roles

                           │
                           ▼
                    TypeScript Game Engine
                           │
          Attack / Defense / Roles / Priority / Win
```

---

# 41. Objetivo final

O produto final deve permitir que um grupo presencial consiga iniciar uma partida rapidamente, distribuir roles de forma secreta e usar os celulares como apoio durante toda a partida.

O aplicativo deve reduzir a quantidade de regras que o mestre precisa memorizar e, ao mesmo tempo, tornar o jogo mais acessível para pessoas que ainda não conhecem todas as roles.

A experiência ideal deve ser:

```text
Criar sala
   ↓
Escanear QR Code
   ↓
Entrar com nome
   ↓
Sortear roles
   ↓
Jogar
```

Quanto menos o aplicativo interromper a interação presencial entre os jogadores, melhor.
