# Town of Salem Board Game Companion — Plano de Implementação por Prompts

Este documento transforma a especificação do projeto em uma sequência de tarefas pequenas para desenvolvimento assistido por IA.

A ideia é **enviar um prompt por vez** ao Codex/ChatGPT/Claude ou outra IA com acesso ao repositório. Não envie todos de uma vez.

---

# Como usar este documento

1. Coloque a especificação principal do projeto no repositório, preferencialmente em:
   - `docs/town-of-salem-companion.md`
2. Use **um prompt por vez**, na ordem deste documento.
3. Depois de cada etapa:
   - revise o diff;
   - rode o projeto;
   - corrija erros antes de continuar;
   - faça um commit.
4. Não permita que a IA implemente etapas futuras “por conveniência”.
5. Quando uma etapa depender de configuração externa do Firebase/Vercel, a IA deve preparar o código e informar exatamente qual ação manual ainda falta, sem inventar credenciais.
6. Se a arquitetura existente do repositório divergir da especificação, a IA deve **adaptar o passo ao código existente**, evitando reescrever partes funcionais sem necessidade.

## Regra geral para todos os prompts

Todos os prompts abaixo assumem:

- Next.js com App Router;
- TypeScript;
- Tailwind CSS;
- Firebase Authentication anônimo;
- Firebase Realtime Database;
- deploy futuro na Vercel;
- mobile first;
- nenhuma conta permanente para jogadores;
- lógica complexa de regras fora dos componentes React;
- informações secretas nunca devem ser protegidas apenas pela UI;
- o Game Engine deve ser independente de React, Next.js e Firebase.

---

# ETAPA 01 — Auditoria inicial do repositório

## Prompt

```text
Analise o repositório atual do Town of Salem Board Game Companion antes de alterar qualquer código.

Leia a especificação do projeto em `docs/town-of-salem-companion.md` se ela existir. Caso esteja em outro local, procure um arquivo Markdown equivalente.

Sua tarefa nesta etapa é SOMENTE:

1. identificar a stack já instalada;
2. identificar a versão do Next.js, React, TypeScript e Tailwind;
3. mapear a estrutura atual de pastas;
4. verificar scripts existentes em package.json;
5. verificar se Firebase, testes, lint e formatação já estão configurados;
6. identificar arquivos ou implementações que já atendam partes da especificação;
7. apontar conflitos entre o código atual e a arquitetura planejada.

Não implemente funcionalidades do jogo ainda.

Se forem necessárias correções mínimas para o projeto compilar ou iniciar, faça somente essas correções.

Ao final:
- rode os checks disponíveis no projeto;
- informe quais comandos foram executados;
- informe os problemas encontrados;
- liste os arquivos alterados;
- pare e não avance para a próxima etapa.
```

### Concluído quando

- o projeto atual está compreendido;
- não há alterações funcionais desnecessárias;
- sabemos exatamente de onde partir.

---

# ETAPA 02 — Base do projeto e organização de pastas

## Prompt

```text
Trabalhe no repositório existente do Town of Salem Board Game Companion e implemente somente a base estrutural do projeto.

Antes de editar, inspecione o estado atual e preserve tudo que já estiver correto.

Objetivo desta etapa:
criar uma organização inicial compatível com a especificação, sem implementar ainda criação de salas, Firebase ou regras do jogo.

Crie, quando ainda não existirem, as estruturas apropriadas para:

- `src/components/ui`
- `src/components/game`
- `src/components/player`
- `src/components/host`
- `src/features/lobby`
- `src/features/roles`
- `src/features/voting`
- `src/features/timer`
- `src/features/night-actions`
- `src/features/game-state`
- `src/game-engine`
- `src/lib/firebase`
- `src/lib/utils`
- `src/data/roles`
- `src/types`

Não crie arquivos vazios apenas para preencher pastas. Crie somente arquivos-base que façam sentido, como barrel files se o projeto já utilizar esse padrão.

Também:
- mantenha App Router;
- mantenha TypeScript estrito;
- não adicione bibliotecas desnecessárias;
- não implemente UI final;
- não implemente Firebase ainda.

Rode lint/typecheck/build conforme disponível.

Ao final, explique resumidamente a estrutura criada, liste arquivos alterados e pare.
```

---

# ETAPA 03 — Tipos centrais do domínio

## Prompt

```text
Implemente somente os tipos centrais de domínio do Town of Salem Board Game Companion.

Não conecte Firebase ainda e não crie componentes de interface.

Crie tipos reutilizáveis e centralizados para pelo menos:

- `GamePhase`
- `GameStatus`
- `PlayerExperience`
- `Player`
- `PrivatePlayerState`
- `Faction`
- `AttackLevel`
- `DefenseLevel`
- `GameEvent`
- `GameEventType`

Use unions/enums apenas quando fizer sentido e evite strings mágicas espalhadas pelo projeto.

GamePhase deve contemplar:
- lobby
- day
- discussion
- trial
- defense
- verdict
- night
- game-over

Player deve contemplar pelo menos:
- id/uid
- name
- seat opcional
- alive
- disconnected
- experience

PrivatePlayerState deve ficar separado dos dados públicos e contemplar pelo menos:
- roleId
- faction
- statuses

Não modele ainda todas as roles ou ações específicas.

Inclua comentários somente onde ajudarem a explicar invariantes importantes.

Rode typecheck/lint/testes existentes.
Liste arquivos alterados e pare.
```

---

# ETAPA 04 — Utilitários de código de sala

## Prompt

```text
Implemente somente os utilitários responsáveis por gerar e validar códigos públicos de sala.

Requisitos:

- código curto e fácil de digitar;
- evitar caracteres visualmente ambíguos como 0/O e 1/I/L;
- normalizar entrada para uppercase;
- função pura para gerar código;
- função pura para normalizar código;
- função pura para validar formato;
- não consultar Firebase nesta etapa.

Exemplo aceitável de formato:
6 caracteres alfanuméricos usando um alfabeto seguro.

Crie testes automatizados para:
- tamanho correto;
- ausência de caracteres proibidos;
- normalização;
- rejeição de códigos inválidos.

Não implemente criação de partida.

Rode os testes e checks.
Liste arquivos alterados e pare.
```

---

# ETAPA 05 — Configuração do Firebase Web SDK

## Prompt

```text
Configure somente a integração-base do Firebase Web SDK no projeto.

Use:
- Firebase Authentication;
- Firebase Realtime Database.

Requisitos:

1. instalar `firebase` se ainda não estiver instalado;
2. criar um módulo central de inicialização do Firebase em `src/lib/firebase`;
3. usar variáveis de ambiente `NEXT_PUBLIC_FIREBASE_*`;
4. criar ou atualizar `.env.example` com:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_DATABASE_URL
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_APP_ID
5. evitar inicialização duplicada durante hot reload;
6. exportar instâncias tipadas de auth e database;
7. não inserir credenciais reais no repositório;
8. não implementar login nem banco ainda.

Se as variáveis reais não existirem, o projeto não deve receber valores inventados. Informe ao final quais valores o usuário precisa obter no console do Firebase.

Rode typecheck/lint/build na medida em que a ausência de envs permitir.

Pare depois desta configuração.
```

---

# ETAPA 06 — Autenticação anônima X

## Prompt

```text
Implemente somente a camada de autenticação anônima usando Firebase Authentication.

Objetivo:
todo navegador que usar o app deve possuir um Firebase UID sem exigir email ou senha.

Crie uma abstração reutilizável para:

- detectar o estado atual da autenticação;
- executar `signInAnonymously` quando necessário;
- expor estado de loading;
- expor o UID autenticado;
- evitar múltiplas chamadas concorrentes de login anônimo.

Pode ser um provider/hook se isso combinar com a arquitetura existente.

Requisitos:
- não criar conta com email;
- não criar tela de login;
- não implementar salas ainda;
- tratar erro de autenticação de forma clara;
- não espalhar chamadas diretas ao Firebase pelos componentes.

Se o Anonymous Auth precisar ser habilitado manualmente no console do Firebase, informe isso no final.

Rode checks e pare.
```

---

# ETAPA 07 — Modelo de caminhos do Realtime Database X

## Prompt

```text
Crie somente a definição de schema lógico e helpers tipados para os caminhos do Firebase Realtime Database.

Ainda não implemente telas.

Adote uma estrutura simples e segura, preferencialmente semelhante a:

roomCodes/{CODE} -> gameId

games/{gameId}/
  hostUid
  public/
    code
    status
    phase
    day
    phaseEndsAt
  settings/
    ...
  players/{uid}/
    name
    alive
    disconnected
    experience
    seat
  privatePlayers/{uid}/
    roleId
    faction
    statuses
  actions/{nightNumber}/{uid}/
  votes/{dayNumber}/
  events/{eventId}/

Requisitos:

- separar explicitamente dados públicos de privados;
- usar UID autenticado como chave do jogador quando isso simplificar regras de segurança;
- criar tipos TypeScript correspondentes;
- criar helpers de path para evitar strings Firebase espalhadas pelo código;
- documentar decisões de schema em `docs/firebase-schema.md`;
- não escrever dados no Firebase ainda.

Se precisar ajustar levemente a especificação original para tornar as Security Rules mais seguras ou simples, faça isso e documente o motivo.

Rode checks e pare.
```

---

# ETAPA 08 — Camada de acesso ao Firebase X

## Prompt

```text
Implemente uma camada de acesso ao Firebase Realtime Database sem criar UI de salas ainda.

Objetivo:
componentes React não devem precisar montar refs e paths manualmente.

Crie funções/repositories tipados para operações futuras, incluindo apenas a infraestrutura necessária para:

- obter referência de uma partida;
- obter referência de código de sala;
- observar dados públicos da partida;
- observar jogadores;
- observar dados privados do jogador autenticado;
- realizar operações atômicas com `update()` quando necessário.

Não implemente ainda `createGame()` ou `joinGame()` completos se eles exigirem decisões da próxima etapa.

Evite:
- lógica de jogo dentro do repository;
- regras de roles;
- chamadas Firebase diretamente em componentes.

Inclua tratamento de erro consistente.

Rode checks e pare.
```

---

# ETAPA 09 — Firebase Security Rules iniciais X

## Prompt

```text
Crie a primeira versão das Firebase Realtime Database Security Rules do projeto.

Objetivo:
estabelecer segurança por identidade antes de implementar informações secretas.

Requisitos conceituais:

- usuário não autenticado não deve operar partidas;
- usuários autenticados podem consultar o mapeamento necessário para entrar por código;
- jogadores de uma partida podem ler os dados públicos necessários;
- jogador pode criar/atualizar somente seus próprios dados públicos dentro dos limites permitidos;
- `privatePlayers/{uid}` só pode ser lido pelo próprio uid ou pelo host da partida;
- somente o host pode atribuir ou alterar roles privadas de outros jogadores;
- ações noturnas devem ser legíveis pelo próprio autor e pelo host, não pelos demais;
- votos devem ser graváveis apenas pelo próprio uid;
- somente o host pode mudar fase/status/timer e dados administrativos.

Crie:
- `database.rules.json`;
- configuração Firebase necessária para que o arquivo possa ser implantado, sem credenciais;
- documentação curta sobre como fazer deploy das rules.

Não invente sintaxe: use sintaxe válida de Firebase Realtime Database Rules.

Se alguma permissão ainda não puder ser expressa com segurança porque a funcionalidade correspondente não existe, adote a regra mais restritiva.

Não implemente UI.

Valide o JSON/sintaxe na medida possível, rode checks e pare.
```

---

# ETAPA 10 — Shell visual e página inicial X 

## Prompt

```text
Implemente somente o shell visual mobile-first e a página inicial do Town of Salem Board Game Companion.

A página deve apresentar:

- nome do projeto;
- ação principal “Criar partida”;
- campo para código de sala;
- ação “Entrar”;
- espaço para mensagens de erro;
- estado de autenticação/carregamento sem expor detalhes técnicos.

Requisitos:
- design simples, legível e mobile first;
- Tailwind CSS;
- acessibilidade básica de formulário;
- Enter deve poder submeter o código;
- ainda não conectar os botões à criação/entrada real da partida;
- não criar animações complexas;
- não implementar roles.

Crie componentes reutilizáveis apenas se houver ganho real.

Rode checks e pare.
```

---

# ETAPA 11 — Criação de partida X

## Prompt

```text
Implemente somente o fluxo real de criação de uma partida.

Fluxo esperado:

1. garantir Firebase Anonymous Auth;
2. gerar `gameId` interno;
3. gerar código público curto;
4. verificar/garantir que o código público não esteja em uso;
5. gravar de forma atômica:
   - `roomCodes/{code} = gameId`
   - `games/{gameId}/hostUid = auth.uid`
   - dados públicos iniciais;
   - status = lobby;
   - phase = lobby;
   - day = 0;
6. inserir o host também como jogador apenas se essa for a decisão arquitetural definida; caso contrário, manter mestre separado e documentar;
7. navegar para a rota do host.

Crie uma função `createGame` fora do componente visual.

Evite race conditions na medida permitida pelo Realtime Database. Se for necessário usar transaction para reservar código, use-a.

Não implemente entrada de outros jogadores ainda.

Adicione tratamento de erro e loading no botão “Criar partida”.

Rode checks e pare.
```

---

# ETAPA 12 — Entrada em partida por código X

## Prompt

```text
Implemente somente o fluxo para localizar e entrar em uma partida existente por código.

Fluxo:

1. usuário já deve estar autenticado anonimamente;
2. normalizar e validar o código;
3. consultar `roomCodes/{CODE}`;
4. validar que a partida existe e aceita jogadores;
5. solicitar nickname e nível de experiência:
   - beginner
   - experienced
6. gravar o jogador em `games/{gameId}/players/{auth.uid}`;
7. navegar para `/game/{code}` ou estrutura equivalente.

Requisitos:
- nickname com validação básica;
- não permitir nickname vazio;
- tratar código inexistente;
- tratar partida que não aceita mais entrada;
- não escrever role;
- não expor dados privados;
- não implementar sorteio ainda.

Faça a UI mínima necessária para o fluxo.

Rode checks e pare.
```

---

# ETAPA 13 — Persistência e reconexão do jogador X

## Prompt

```text
Implemente somente a reconexão de jogadores após refresh ou reabertura da página.

Como o Firebase Anonymous Auth persiste o UID, a aplicação deve:

- reconhecer que o UID já pertence a um jogador da sala;
- não pedir nickname novamente;
- recuperar os dados públicos do próprio jogador;
- restaurar a tela correta;
- marcar/atualizar estado de conexão quando viável;
- tratar caso o jogador tenha sido removido da partida;
- tratar caso a partida tenha terminado ou não exista.

Não crie ainda um Presence System complexo. Se usar `.info/connected` e `onDisconnect`, mantenha a implementação simples e documentada.

Não implemente sorteio nem fases novas.

Rode checks e pare.
```

---

# ETAPA 14 — Lobby em tempo real X

## Prompt

```text
Implemente somente o lobby em tempo real.

No lado do jogador:
- mostrar código da sala;
- mostrar lista de jogadores conectados;
- mostrar quantidade de jogadores;
- mostrar status aguardando o mestre iniciar;
- atualizar automaticamente via Realtime Database.

No lado do host:
- mostrar a mesma lista;
- indicar claramente que ele é o mestre;
- mostrar estado de conexão quando disponível.

Requisitos:
- usar subscriptions encapsuladas em hooks/repositories;
- limpar listeners no unmount;
- evitar polling;
- não exibir qualquer role;
- ainda não permitir iniciar a partida.

Rode checks e pare.
```

---

# ETAPA 15 — QR Code da sala X

## Prompt

```text
Adicione somente compartilhamento da sala por QR Code.

No painel/lobby do host:
- gerar QR Code contendo a URL pública da partida;
- mostrar também o código textual;
- adicionar ação simples para copiar link/código;
- funcionar bem em celular.

Use uma biblioteca pequena e mantida se necessário. Não gere QR manualmente.

A URL deve apontar para um fluxo que permita entrar na sala sem precisar digitar novamente o código.

Não implemente outras funcionalidades.

Rode checks e pare.
```

---

# ETAPA 16 — Catálogo tipado de roles X

## Prompt

```text
Implemente somente a infraestrutura do catálogo de roles.

Crie `RoleDefinition` com campos apropriados, por exemplo:

- id
- name
- faction
- alignment
- description
- beginnerDescription
- goal
- attack
- defense
- action opcional
- priority opcional

Crie inicialmente registros para:

Town:
- Sheriff
- Doctor
- Investigator
- Vigilante

Mafia:
- Godfather
- Mafioso
- Consigliere

Neutral:
- Jester
- Serial Killer

IMPORTANTE:
não invente regras específicas da edição física quando elas não estiverem confirmadas na especificação ou em uma fonte fornecida pelo usuário.

Quando uma propriedade mecânica estiver incerta:
- modele o campo;
- marque o conteúdo como TODO/needs-verification;
- não crie uma regra falsa.

O catálogo deve ficar fora do Firebase e fora de componentes React.

Crie helpers:
- getRoleById
- getRolesByFaction
- isValidRoleId

Adicione testes básicos do catálogo.

Pare após os checks.
```

---

# ETAPA 17 — Enciclopédia pública de roles

## Prompt

```text
Implemente somente páginas públicas de consulta das roles já existentes no catálogo.

Rota sugerida:
`/roles/[slug]`

Cada página deve apresentar:
- nome;
- facção;
- alignment;
- objetivo;
- descrição;
- explicação para iniciante quando existir;
- ataque/defesa apenas quando fizer sentido e estiver confirmado.

Também crie uma listagem simples de roles.

Requisitos:
- dados vêm exclusivamente do catálogo central;
- não duplicar textos em componentes;
- mobile first;
- não mostrar dados de partidas;
- não implementar sorteio.

Rode checks e pare.
```

---

# ETAPA 18 — Seleção manual de roles pelo host

## Prompt

```text
Implemente somente a seleção manual de roles no lobby do host.

O host deve conseguir:
- visualizar as roles disponíveis agrupadas por facção/alignment;
- adicionar uma role à composição;
- remover uma role;
- permitir múltiplas cópias somente se a regra/configuração do projeto permitir;
- ver quantidade de roles selecionadas;
- ver quantidade de jogadores conectados.

Persistir a composição em uma área de settings da partida no Firebase para que sobreviva a refresh.

Somente o host pode alterar essa seleção.

Não faça sorteio ainda.

Rode checks e pare.
```

---

# ETAPA 19 — Validação da composição

## Prompt

```text
Implemente somente a validação da composição de roles.

Crie funções puras fora da UI que verifiquem pelo menos:

- quantidade de roles == quantidade de jogadores que participarão;
- ids de roles válidos;
- composição vazia;
- duplicações proibidas quando aplicável;
- qualquer outra invariável já explicitamente definida no projeto.

Retorne erros estruturados, não apenas boolean.

Exemplo conceitual:
{
  valid: false,
  errors: [...]
}

Integre essa validação à tela do host:
- impedir início/sorteio quando inválido;
- mostrar mensagens claras.

Não sorteie roles ainda.

Crie testes.

Rode checks e pare.
```

---

# ETAPA 20 — Algoritmo puro de sorteio

## Prompt

```text
Implemente somente o algoritmo puro de sorteio de roles.

Crie uma função independente de Firebase e React que receba:
- lista de player UIDs participantes;
- lista de role IDs validada;
- fonte opcional de aleatoriedade para facilitar testes.

Retorne um mapa:
playerUid -> roleId

Requisitos:
- exatamente uma role por jogador;
- todas as roles selecionadas utilizadas exatamente uma vez;
- não mutar arrays recebidos;
- Fisher-Yates ou algoritmo de embaralhamento adequado;
- testes determinísticos usando RNG injetável;
- não persistir o resultado ainda.

Não implemente UI nova.

Rode os testes e pare.
```

---

# ETAPA 21 — Sorteio e persistência segura das roles

## Prompt

```text
Integre o sorteio de roles ao Firebase, sem alterar ainda as regras específicas das roles.

Fluxo:
1. somente host pode acionar;
2. revalidar composição imediatamente antes do sorteio;
3. gerar assignments usando o algoritmo puro;
4. gravar cada role em `privatePlayers/{uid}`;
5. nunca gravar role no objeto público do jogador;
6. atualizar status da partida para indicar que as roles foram atribuídas;
7. realizar gravação de forma atômica sempre que possível;
8. impedir sorteio duplicado acidental depois que a partida já começou, salvo fluxo administrativo explicitamente permitido.

As Security Rules devem garantir:
- host lê todos;
- cada jogador lê apenas seu próprio privatePlayer;
- demais jogadores não leem.

Adicione feedback de sucesso/erro ao host.

Não inicie Day/Night ainda.

Rode checks e pare.
```

---

# ETAPA 22 — Tela privada da role do jogador

## Prompt

```text
Implemente somente a tela privada da role atribuída ao jogador.

O jogador autenticado deve conseguir ver apenas:
- sua role;
- facção/alignment;
- objetivo;
- descrição;
- explicação para iniciante se `experience === beginner`.

Requisitos:
- ler `privatePlayers/{auth.uid}`;
- usar o catálogo local para transformar roleId em conteúdo;
- nunca baixar/listar os privatePlayers dos outros jogadores;
- mostrar estado de loading seguro;
- tratar ausência de role antes do sorteio;
- tratar roleId inválido sem vazar dados.

Inclua um botão/área “Como jogar esta role” usando o mesmo catálogo.

Rode checks e pare.
```

---

# ETAPA 23 — Visão de roles para o host

## Prompt

```text
Implemente somente a visualização administrativa das roles no painel do host.

O host pode ver:
- jogador;
- role atribuída;
- facção;
- vivo/morto.

Requisitos:
- verificar host pelo UID real da partida;
- subscriptions de dados privados somente no painel do host;
- não reutilizar essa query em componentes acessíveis a jogadores;
- não criar ainda controles de morte/fase.

Mantenha a UI compacta e adequada para uso durante uma partida presencial.

Rode checks e pare.
```

---

# CHECKPOINT A — Primeiro MVP jogável

Neste ponto deve ser possível:

- criar sala;
- entrar;
- reconectar;
- ver lobby em tempo real;
- selecionar roles;
- sortear;
- cada jogador ver somente sua role;
- mestre ver todas.

Antes de continuar, faça um playtest técnico com pelo menos dois navegadores/perfis.

---

# ETAPA 24 — Máquina de estados das fases

## Prompt

```text
Implemente somente o modelo de transições de fase da partida.

Crie uma máquina de estados simples e centralizada para GamePhase.

Defina transições permitidas, por exemplo conceitual:
lobby -> day/night conforme regra inicial configurada
day -> discussion
discussion -> trial ou night
trial -> defense
defense -> verdict
verdict -> discussion/day/night conforme resultado
night -> day
qualquer estado válido -> game-over quando condição administrativa permitir

Não espalhe lógica de transição em componentes.

Crie funções como:
- canTransition(from, to)
- getAllowedTransitions(phase)

Não presuma ainda automações complexas de Town of Salem que não estejam confirmadas.

Adicione testes.

Não integre Firebase nesta etapa além do mínimo necessário se já existir tipo compartilhado.

Rode checks e pare.
```

---

# ETAPA 25 — Controle de fases pelo host

## Prompt

```text
Integre a máquina de estados ao painel do host.

O host deve:
- ver fase atual;
- ver transições permitidas;
- avançar/mudar para uma fase permitida;
- não conseguir escrever uma fase inválida;
- atualizar o Firebase;
- gerar um evento PHASE_CHANGED no histórico se o sistema de eventos já existir; se ainda não existir, deixe um hook claro para a etapa futura sem inventar infraestrutura grande.

Jogadores devem receber a fase atual em tempo real.

Não implemente timer ainda.

Rode checks e pare.
```

---

# ETAPA 26 — Timer sincronizado

## Prompt

```text
Implemente somente o timer sincronizado das fases.

Modelo:
não decremente um contador global no Firebase a cada segundo.

Persistir:
- `phaseEndsAt` como timestamp absoluto;
- estado paused quando necessário;
- duração restante ao pausar.

Cada cliente deve calcular localmente:
remaining = phaseEndsAt - serverAdjustedNow

Quando possível, considere o offset de relógio disponibilizado pelo Firebase em `.info/serverTimeOffset`.

O host deve conseguir:
- iniciar timer;
- pausar;
- retomar;
- adicionar +30 segundos;
- encerrar.

Jogadores:
- apenas visualizar.

Crie um hook/componente reutilizável de timer.

Não avance fase automaticamente ainda, a menos que isso seja explicitamente pequeno e seguro; prefira nesta etapa apenas emitir estado “tempo encerrado”.

Rode checks e pare.
```

---

# ETAPA 27 — Status vivo/morto

## Prompt

```text
Implemente somente o controle de status vivo/morto.

Host:
- pode marcar jogador como morto;
- pode reviver para corrigir erro administrativo;
- deve receber confirmação simples antes de mudanças destrutivas durante uma partida.

Jogador:
- vê claramente seu status;
- jogador morto permanece conectado;
- jogador morto não perde acesso à descrição de sua própria role.

Dados:
use o campo público `alive`.

Não implemente ainda votação ou night action gating além de helpers simples que serão utilizados nas próximas etapas.

Crie funções reutilizáveis:
- isPlayerEligibleToVote
- isPlayerEligibleForNightAction

Rode checks e pare.
```

---

# ETAPA 28 — Votação de acusação

## Prompt

```text
Implemente somente a votação de acusação durante a fase apropriada.

Requisitos:
- apenas jogadores vivos votam;
- cada UID possui no máximo um voto ativo;
- jogador pode trocar voto;
- jogador pode remover voto;
- jogador não pode votar em alvo morto;
- não confiar apenas na UI: regras/validações devem impedir gravações inválidas na medida possível;
- dados ficam em `votes/{dayNumber}/accusations/{uid}`;
- atualização em tempo real.

Crie funções puras para contagem.

Não inicie Trial automaticamente ainda.

Crie UI mobile-first para o jogador e resumo para o host.

Rode checks e pare.
```

---

# ETAPA 29 — Cálculo de votos necessários e início de Trial

## Prompt

```text
Implemente somente o cálculo do threshold de acusação e a transição para Trial.

Primeiro:
- identifique na especificação/configuração qual fórmula deve ser usada;
- se a regra exata da edição física não estiver definida, torne a fórmula configurável e marque o default como configuração explícita, sem alegar que é a regra oficial.

Crie função pura:
getVotesRequired(alivePlayers, settings)

Quando um alvo atingir o threshold:
- selecionar acusado;
- bloquear/limpar votos de acusação conforme desenho do projeto;
- permitir que o host confirme/inicie Trial, ou automatizar somente se isso já estiver definido;
- persistir accusedPlayerUid.

Adicione testes de contagem e edge cases.

Rode checks e pare.
```

---

# ETAPA 30 — Votação Guilty / Innocent / Abstain

## Prompt

```text
Implemente somente a votação de veredito.

Durante a fase verdict:
- apenas jogadores vivos elegíveis podem votar;
- acusado não vota se essa for a regra configurada; se ainda não estiver confirmada, modele essa elegibilidade como configuração;
- opções:
  - guilty
  - innocent
  - abstain
- um voto por UID;
- voto pode ser atualizado enquanto a votação estiver aberta;
- calcular resultado automaticamente quando encerrada;
- empate deve possuir comportamento configurável/documentado.

Não execute o jogador automaticamente sem uma ação explícita do fluxo definida.

Crie funções puras para resultado e testes.

Rode checks e pare.
```

---

# CHECKPOINT B — Fluxo de dia

Neste ponto testar:

- mudança de fases;
- timer;
- vivo/morto;
- acusação;
- Trial;
- veredito.

---

# ETAPA 31 — Modelo genérico de ações noturnas

## Prompt

```text
Implemente somente o modelo de domínio para ações noturnas.

Crie tipos para:
- actionType
- actorUid
- targetUid
- secondaryTargetUid opcional
- nightNumber
- createdAt
- metadata estritamente tipado quando necessário

As definições de role devem poder declarar:
- se possuem ação noturna;
- tipo de alvo permitido;
- se podem mirar em si mesmas;
- quantidade de alvos;
- actionType;
- priority futura.

Não implemente resolução da noite ainda.

Não invente regras de roles incertas. Estruture o sistema para receber essas regras depois.

Adicione validação pura de targets e testes.

Rode checks e pare.
```

---

# ETAPA 32 — Envio da ação noturna pelo jogador

## Prompt

```text
Implemente somente a interface e persistência da escolha noturna.

Quando a fase for night e a role do jogador possuir ação:
- mostrar somente alvos permitidos;
- impedir alvos mortos quando a regra exigir;
- respeitar self-targeting conforme definição da role;
- permitir confirmar/trocar a ação enquanto a noite estiver aberta;
- gravar apenas em `actions/{nightNumber}/{auth.uid}`;
- outros jogadores não podem ler essa ação;
- host pode ler.

Jogadores sem ação noturna devem receber uma tela informativa, não um formulário vazio.

Não resolva a noite ainda.

Atualize Security Rules se necessário.

Rode checks e pare.
```

---

# ETAPA 33 — Dashboard de ações da noite para o host

## Prompt

```text
Implemente somente o painel do host para acompanhar ações da noite.

Mostrar:
- jogadores vivos com ação esperada;
- status “aguardando” ou “enviada”;
- detalhes da ação enviada, somente para o host;
- quantidade recebida / esperada.

Não mostrar detalhes secretos em componentes compartilhados com jogadores.

Não resolver automaticamente.

Inclua ação administrativa para encerrar recebimento da noite, mas ela ainda não deve aplicar efeitos do Game Engine.

Rode checks e pare.
```

---

# ETAPA 34 — Fundação do Game Engine

## Prompt

```text
Crie somente a fundação independente do Game Engine.

O código deve ficar em `src/game-engine` e não importar:
- React;
- Next.js;
- Firebase.

Defina estruturas imutáveis para:
- GameState;
- EnginePlayer;
- EngineRole;
- NightAction;
- NightResolution;
- EngineEvent.

Crie uma função inicialmente estrutural:

resolveNight(gameState, actions)

Por enquanto ela pode validar entrada e retornar uma resolução vazia/estruturada.

Requisitos:
- funções puras;
- sem I/O;
- sem Date.now interno quando puder ser injetado;
- sem Firebase;
- testes unitários.

Não implemente ainda ataque/defesa.

Rode testes e pare.
```

---

# ETAPA 35 — Sistema de ataque e defesa

## Prompt

```text
Implemente somente o módulo de ataque e defesa do Game Engine.

Use os níveis já tipados:
AttackLevel:
- none
- basic
- powerful
- unstoppable

DefenseLevel:
- none
- basic
- powerful
- invincible

Crie funções puras para comparar ataque e defesa e retornar resultado estruturado, por exemplo:
{
  success,
  attackLevel,
  defenseLevel,
  reasonCode
}

IMPORTANTE:
não assuma relações entre níveis se elas não estiverem definidas/confirmadas no projeto.
Se a hierarquia proposta na especificação for tratada como regra do projeto, codifique-a de forma central e testável; caso contrário, deixe a tabela de interação configurável.

Não use nomes de roles dentro do módulo de ataque/defesa.

Adicione testes de todas as combinações suportadas.

Pare após os testes.
```

---

# ETAPA 36 — Priority Pipeline

## Prompt

```text
Implemente somente o sistema genérico de prioridade das ações noturnas.

Crie:
- ActionPriority ou estrutura equivalente;
- função para ordenar ações por prioridade;
- pipeline previsível que nunca dependa da ordem de envio no Firebase.

Categorias conceituais possíveis:
- roleblock
- redirect
- protect
- investigate
- attack
- post-attack

IMPORTANTE:
a ordem real das regras da edição física deve ser confirmada. Não apresente uma ordem provisória como oficial.

Permita configurar prioridades nas RoleDefinitions/ActionDefinitions.

Adicione testes comprovando que a ordem de envio não muda a ordem de resolução.

Não implemente todos os efeitos ainda.

Rode testes e pare.
```

---

# ETAPA 37 — Roleblock e proteção

## Prompt

```text
Implemente somente os efeitos genéricos de roleblock e proteção no Game Engine.

Requisitos:
- roleblock deve conseguir marcar uma ação elegível como impedida;
- proteção deve registrar um efeito defensivo temporário;
- não codificar `if role === "doctor"` dentro do resolver genérico;
- roles devem produzir tipos de ação/efeitos, e o engine resolve esses efeitos;
- retorno deve conter eventos estruturados para debug.

Implemente apenas interações cujas regras estejam confirmadas no projeto.
Quando houver dúvida, deixe teste pendente/TODO explícito em vez de inventar regra.

Crie testes unitários.

Não integrar Firebase ainda.

Pare.
```

---

# ETAPA 38 — Investigação e ataques

## Prompt

```text
Implemente somente os efeitos genéricos de investigação e ataque no Game Engine.

Investigação:
- receber ator/alvo/contexto;
- produzir resultado privado destinado ao ator;
- não acoplar o resolver a UI.

Ataque:
- usar exclusivamente o módulo central de attack/defense;
- suportar múltiplos ataques na mesma noite de forma determinística;
- produzir eventos estruturados;
- calcular possíveis mortes apenas depois dos efeitos relevantes da pipeline.

Não invente resultados específicos de Sheriff/Investigator/Consigliere se a tabela da edição física ainda não estiver confirmada. Crie a infraestrutura e implemente apenas mappings confirmados.

Adicione testes.

Pare.
```

---

# ETAPA 39 — Resolver da noite completo para o conjunto inicial

## Prompt

```text
Complete o `resolveNight` somente para o conjunto inicial de mecânicas já confirmadas e implementadas.

Fluxo esperado:
1. validar ações;
2. normalizar;
3. ordenar por prioridade;
4. aplicar roleblocks;
5. aplicar redirects se já existirem; caso contrário, não inventar;
6. aplicar proteções;
7. aplicar ataques;
8. aplicar investigações;
9. determinar mortes;
10. gerar mensagens/resultados privados;
11. gerar eventos estruturados.

Requisitos:
- resultado determinístico para mesmas entradas;
- nenhuma dependência de Firebase;
- nenhum side effect;
- cobertura de testes para cenários compostos;
- bugs encontrados devem virar testes.

Não implemente novas roles só para preencher a engine.

Rode testes e pare.
```

---

# ETAPA 40 — Integração do Game Engine com a partida

## Prompt

```text
Integre o Game Engine ao fluxo real da partida, sem mover lógica do engine para Firebase/React.

Fluxo do host:
1. obter snapshot consistente do estado relevante;
2. obter ações da noite;
3. converter dados Firebase -> GameState;
4. executar `resolveNight`;
5. mostrar PREVIEW da resolução ao host;
6. somente após confirmação do host, persistir efeitos:
   - mortes;
   - resultados privados;
   - eventos;
   - estado da noite como resolvida.

A aplicação não deve aplicar a mesma noite duas vezes.
Crie idempotência/flag de resolução por número da noite.

Não avançar fase automaticamente se isso puder esconder erros; primeiro permitir revisão do host.

Atualize regras de segurança se necessário.

Rode checks e pare.
```

---

# ETAPA 41 — Resultados privados da noite

## Prompt

```text
Implemente somente a entrega dos resultados privados gerados pelo Game Engine.

Exemplos:
- resultado de investigação;
- informação privada produzida por uma habilidade;
- feedback de ação quando permitido.

Persistir resultados em uma árvore privada por jogador e por noite, por exemplo:
`nightResults/{nightNumber}/{uid}`

Security Rules:
- próprio uid lê;
- host lê;
- outros jogadores não leem.

A interface do jogador deve mostrar seus resultados no momento apropriado sem revelar dados de terceiros além do permitido pela regra.

Não invente textos/rules não confirmados.

Rode checks e pare.
```

---

# ETAPA 42 — Condições de vitória

## Prompt

```text
Implemente somente o módulo de condições de vitória.

Crie função pura:
checkWinCondition(gameState)

Ela deve retornar estrutura como:
{
  gameOver,
  winningFactions,
  winningPlayerUids,
  reasonCode
}

Arquitetura:
- regras de vitória por facção/role devem ser modulares;
- não hardcode em componentes;
- neutrals com condições especiais devem poder fornecer sua própria regra;
- não inventar condições específicas ainda não confirmadas.

Implemente primeiro apenas condições confirmadas para as roles/facções disponíveis.

Crie testes de:
- partida ainda não terminou;
- vitória Town;
- vitória Mafia;
- situações neutras já confirmadas.

Não integrar automaticamente à UI até os testes passarem.

Pare.
```

---

# ETAPA 43 — Game Over

## Prompt

```text
Integre as condições de vitória ao fluxo da partida.

Após eventos que possam alterar o resultado:
- host/engine pode executar checkWinCondition;
- se gameOver, persistir status/phase game-over;
- registrar vencedores;
- impedir novas ações e votos;
- manter dados para tela final.

Tela Game Over deve mostrar somente informações apropriadas:
- facção vencedora;
- jogadores vencedores;
- roles reveladas apenas se a configuração permitir revelar no fim.

Host deve poder encerrar manualmente uma partida em caso de necessidade.

Rode checks e pare.
```

---

# ETAPA 44 — Histórico de eventos

## Prompt

```text
Implemente somente o histórico estruturado de eventos da partida.

Crie uma API central para registrar eventos como:
- PLAYER_JOINED
- GAME_STARTED
- ROLE_ASSIGNED
- PHASE_CHANGED
- ACTION_SUBMITTED
- PLAYER_ROLEBLOCKED
- PLAYER_ATTACKED
- PLAYER_PROTECTED
- PLAYER_DIED
- TRIAL_STARTED
- PLAYER_EXECUTED
- GAME_ENDED

Requisitos:
- eventos possuem timestamp;
- payload tipado quando possível;
- dados secretos não podem ir para um log público;
- diferenciar eventos públicos e privados/host-only se necessário;
- painel do host pode ter uma timeline técnica simples.

Não transforme isso em sistema de analytics.

Rode checks e pare.
```

---

# CHECKPOINT C — Assisted Mode

Neste ponto o app deve conseguir administrar uma partida pequena com:

- lobby;
- roles;
- fases;
- timer;
- votação;
- ações noturnas;
- resolução;
- mortes;
- vitória.

Faça playtest antes de adicionar automações de balanceamento.

---

# ETAPA 45 — Presets de composição

## Prompt

```text
Implemente somente presets de composição de partida.

Crie uma estrutura de dados tipada para presets como:
- Beginner
- Balanced
- Classic
- Chaos

IMPORTANTE:
não invente listas “oficiais” de composição se elas não forem fornecidas.

Inicialmente:
- crie a infraestrutura de preset;
- use somente presets validados pela documentação do projeto;
- qualquer preset provisório deve ser claramente marcado como custom/experimental.

O host deve conseguir:
- selecionar preset;
- visualizar composição resultante;
- editar manualmente depois.

Não implemente score de balanceamento ainda.

Rode checks e pare.
```

---

# ETAPA 46 — Gerador de composição por slots

## Prompt

```text
Implemente somente um gerador de composição baseado em slots/categorias.

Exemplo conceitual:
- Town Investigative
- Town Protective
- Town Killing
- Random Town
- Mafia Killing
- Mafia Support
- Neutral Evil
- Neutral Killing

Crie algoritmo puro que:
- recebe quantidade de jogadores;
- recebe slots;
- recebe catálogo elegível;
- resolve cada slot;
- evita combinações inválidas conhecidas;
- aceita RNG injetável;
- retorna erros quando não for possível satisfazer os slots.

Não invente categorias ou restrições que não estejam confirmadas.

Adicione testes.

Integre ao host apenas após os testes.

Pare.
```

---

# ETAPA 47 — Score experimental de balanceamento

## Prompt

```text
Implemente somente a infraestrutura EXPERIMENTAL de score de balanceamento.

Este recurso não deve alegar que determina objetivamente se uma partida é justa.

Crie:
- pesos configuráveis por role;
- cálculo por facção;
- score normalizado opcional;
- explicação de que é uma heurística;
- possibilidade de desativar o recurso.

Não escolha pesos arbitrários como se fossem definitivos.
Se não houver pesos fornecidos, use fixture/test data claramente experimental ou deixe os valores configuráveis sem defaults de produção.

UI deve identificar claramente “estimativa experimental”.

Crie testes matemáticos da função.

Pare.
```

---

# ETAPA 48 — Calculadora de interações do host

## Prompt

```text
Implemente somente a calculadora de interações para o host.

Objetivo:
responder perguntas como “este ataque consegue matar este alvo neste contexto?”

Requisitos:
- reutilizar o mesmo Game Engine;
- nunca duplicar regras em componente;
- permitir escolher ator/role, alvo/role e ação;
- montar um contexto simulado;
- mostrar resultado e reasonCode traduzido para texto;
- deixar claro quando uma regra ainda não está modelada.

A ferramenta não deve alterar a partida real.

Adicione testes de integração do calculator com o engine.

Pare.
```

---

# ETAPA 49 — PWA

## Prompt

```text
Transforme o projeto em PWA sem alterar a lógica do jogo.

Implemente:
- manifest;
- nome curto e nome completo;
- ícones referenciados corretamente;
- theme/background apropriados;
- modo standalone;
- metadata necessária;
- instalação em Android/iOS quando suportada pelo navegador.

Offline completo NÃO é requisito porque a partida depende do Firebase Realtime.

Evite service worker agressivo que possa cachear estado de partida e causar dados obsoletos.

Se utilizar biblioteca de PWA, escolha uma compatível com a versão atual do Next.js e justifique.

Rode build e checks.

Pare.
```

---

# ETAPA 50 — Hardening das Security Rules

## Prompt

```text
Faça uma auditoria de segurança focada EXCLUSIVAMENTE no Firebase Realtime Database.

Revise todas as paths existentes e garanta:

- ninguém não autenticado consegue ler/escrever estado de partida sensível;
- jogador não consegue alterar outro jogador;
- jogador não consegue se marcar como host;
- jogador não consegue alterar fase;
- jogador não consegue alterar role;
- jogador não consegue ler role de outro;
- jogador não consegue ler ação noturna de outro;
- jogador não consegue falsificar voto de outro UID;
- jogador morto não consegue escrever ações/votos proibidos quando isso puder ser validado nas rules;
- host possui apenas permissões administrativas necessárias;
- validações de tipos/shape/tamanho são usadas onde aplicável.

Crie testes de rules com Firebase Emulator se a infraestrutura do projeto permitir.

Inclua casos maliciosos explícitos.

Não altere UX nesta etapa.

Rode testes e pare.
```

---

# ETAPA 51 — Validação de entradas e resiliência

## Prompt

```text
Faça uma etapa de hardening de aplicação sem adicionar novas funcionalidades.

Revise:
- nickname;
- room code;
- role IDs;
- actions;
- votes;
- phase transitions;
- timestamps;
- limites de jogadores;
- double submit;
- refresh;
- desconexão;
- tentativa de usar partida inexistente;
- partida já encerrada;
- Firebase offline/erro temporário.

Adicione:
- validação de entrada;
- estados de erro úteis;
- idempotência onde necessário;
- loading states;
- disabled states;
- proteção contra cliques duplos.

Não redesenhe todo o app.

Adicione testes para bugs encontrados.

Pare.
```

---

# ETAPA 52 — UX mobile para partida presencial

## Prompt

```text
Faça somente uma revisão de UX mobile-first para uso presencial.

Não altere regras do jogo.

Prioridades:
- botões grandes;
- contraste;
- tipografia legível;
- informação principal acima da dobra;
- não exigir menus complexos durante a noite;
- confirmação em ações irreversíveis;
- feedback imediato ao enviar voto/ação;
- status claro de “ação enviada”;
- status claro de vivo/morto;
- timer sempre fácil de encontrar;
- evitar que informação secreta apareça acidentalmente em previews/headers.

Teste layouts pelo menos em larguras aproximadas:
- 320px
- 375px
- 430px
- desktop para o painel do host.

Corrija apenas problemas concretos.

Rode checks e pare.
```

---

# ETAPA 53 — Acessibilidade básica

## Prompt

```text
Faça somente uma auditoria e correção de acessibilidade básica.

Verifique:
- labels;
- focus states;
- navegação por teclado;
- elementos button vs div clicável;
- aria apenas quando necessário;
- contraste;
- mensagens de erro;
- dialogs;
- estados disabled;
- leitura do timer sem anunciar a cada segundo de forma perturbadora;
- não depender apenas de cor para vivo/morto/facção/status.

Não alterar mecânicas.

Rode lint/checks e pare.
```

---

# ETAPA 54 — Testes E2E do primeiro fluxo completo

## Prompt

```text
Adicione testes end-to-end para o fluxo principal do MVP usando a ferramenta que melhor se encaixar no repositório, preferencialmente Playwright se não houver solução existente.

Cobrir ao menos:

1. host abre app;
2. cria sala;
3. segundo contexto/navegador entra com código;
4. nickname aparece no lobby;
5. host seleciona composição válida;
6. host sorteia;
7. jogador vê sua própria role;
8. jogador não consegue acessar role de outro via UI;
9. host muda fase;
10. jogador recebe atualização;
11. voto é enviado;
12. ação noturna é enviada.

Se testes reais dependem do Firebase Emulator, configure-os para não operar no banco de produção.

Não crie mocks que escondam a lógica principal sem necessidade.

Rode a suíte e pare.
```

---

# ETAPA 55 — Primeiro playtest assistido

## Prompt

```text
Prepare o projeto para o primeiro playtest real sem adicionar novas roles.

Crie apenas ferramentas de diagnóstico úteis para desenvolvimento:

- versão/build visível discretamente no painel do host;
- botão de copiar ID/código da partida;
- exportação do event log da partida para JSON somente pelo host, se simples e segura;
- mensagens de erro com códigos técnicos copiáveis para debugging;
- checklist em `docs/playtest-checklist.md`.

O checklist deve pedir para testar:
- entrada/reconexão;
- segredo das roles;
- timer;
- votação;
- morte;
- ações;
- resolução da noite;
- Game Over;
- uso simultâneo em celulares.

Não adicionar analytics externo.

Pare.
```

---

# ETAPA 56 — Correção pós-playtest

## Prompt

```text
Analise os bugs e observações registrados no último playtest do Town of Salem Board Game Companion.

Nesta etapa, não adicione funcionalidades novas.

Para cada bug:
1. reproduza;
2. identifique causa raiz;
3. crie teste que falhe quando aplicável;
4. implemente a menor correção consistente;
5. rode a suíte relevante;
6. documente qualquer mudança de regra.

Prioridade:
1. vazamento de informação secreta;
2. inconsistência do estado da partida;
3. erro de Game Engine;
4. erros de votação/fases;
5. reconexão;
6. UX.

Ao final, produza um resumo de bugs corrigidos e pare.
```

---

# ETAPA 57 — Configuração para Vercel

## Prompt

```text
Prepare somente o projeto para deploy na Vercel.

Verifique:
- build de produção;
- variáveis NEXT_PUBLIC_FIREBASE_* necessárias;
- URLs absolutas usadas no QR Code;
- metadata;
- redirects/rewrite se existirem;
- uso correto de client/server components;
- ausência de segredos reais no Git;
- comportamento de rotas diretas como `/game/[code]` e `/host/[code]`.

Crie documentação `docs/deploy-vercel.md` com:
- variáveis necessárias;
- comando de build;
- passos manuais mínimos;
- como configurar domínio futuramente;
- como verificar Firebase authorized domains.

Não faça alterações de mecânica.

Rode `build` e pare.
```

---

# ETAPA 58 — Auditoria final do MVP

## Prompt

```text
Faça uma auditoria final do MVP do Town of Salem Board Game Companion comparando o código atual com `docs/town-of-salem-companion.md`.

Não implemente automaticamente recursos fora do MVP.

Produza uma matriz:

- requisito;
- implementado;
- parcialmente implementado;
- não implementado;
- teste existente;
- risco.

Revise especialmente:
- segredo das roles;
- Firebase Rules;
- reconnect;
- realtime;
- timers;
- votos;
- Game Engine;
- condições de vitória;
- mobile;
- PWA;
- deploy.

Corrija somente bugs evidentes e pequenos encontrados durante a auditoria.

Para itens maiores ainda ausentes, registre backlog em `docs/backlog.md`.

Rode todos os checks disponíveis e pare.
```

---

# Depois do MVP

Somente após uma versão estável, criar novos prompts individuais para:

- novas roles;
- redirects/transport;
- imunidades especiais;
- death notes;
- wills, se fizerem sentido na versão física;
- presets avançados;
- estatísticas;
- histórico de partidas;
- modo Classic Companion;
- modo Automated;
- sons;
- animações;
- internacionalização.

A regra deve continuar sendo:

> **uma mecânica por vez, com testes antes de adicionar a próxima.**

---

# Modelo de prompt para adicionar uma nova role

Quando chegar a hora de implementar novas roles, use este modelo:

```text
Adicione SOMENTE a role [NOME DA ROLE] ao Town of Salem Board Game Companion.

Antes de programar:
1. leia a definição atual de RoleDefinition;
2. leia o Game Engine;
3. leia os testes existentes;
4. confirme que as regras abaixo são suficientes.

Regras confirmadas da role:
[COLE AQUI AS REGRAS DA EDIÇÃO FÍSICA]

Implemente:
- catálogo;
- faction/alignment;
- objetivo;
- ação;
- targeting;
- priority;
- attack/defense quando aplicável;
- efeitos no Game Engine;
- resultado privado;
- condições especiais de vitória se existirem;
- textos beginner/experienced;
- testes unitários;
- teste de interação com roles já existentes.

Não altere regras de outras roles sem necessidade.
Não invente comportamento não especificado.
Se houver ambiguidade nas regras fornecidas, pare a implementação daquela interação e marque claramente o ponto pendente.

Rode testes e liste arquivos alterados.
Não implemente outra role.
```

---

# Modelo de prompt para corrigir uma interação de regra

```text
Corrija SOMENTE esta interação do Game Engine:

[CENÁRIO]

Comportamento atual:
[ATUAL]

Comportamento correto:
[CORRETO]

Fonte/regra usada:
[REGRA CONFIRMADA]

Antes de alterar:
- localize onde essa regra possui sua fonte de verdade;
- verifique se o bug é de definição de role, prioridade ou resolver.

Depois:
1. crie um teste reproduzindo o bug;
2. confirme que ele falha antes da correção;
3. faça a menor alteração correta;
4. confirme que o novo teste passa;
5. rode regressão do Game Engine.

Não adicione exceção no componente React.
Não duplique regra.
Não altere outras interações sem necessidade.
```

---

# Estratégia de commits sugerida

Um commit por etapa ou conjunto muito pequeno de etapas.

Exemplos:

```text
chore: scaffold project domain structure
feat: configure firebase anonymous auth
feat: add realtime lobby
feat: add role catalog
feat: add secure role assignment
feat: add synchronized game timer
feat: add accusation voting
feat: add night action submission
feat: add game engine attack resolution
test: cover night resolution interactions
fix: prevent private role data leak
```

Isso permite voltar facilmente quando uma IA introduzir regressão.

---

# Regra de ouro do projeto

Se uma IA tentar implementar uma etapa futura durante o prompt atual, peça para remover essa parte.

O objetivo deste plano não é gerar o aplicativo o mais rápido possível.

O objetivo é fazer com que cada camada fique estável antes de depender dela:

```text
Infraestrutura
      ↓
Identidade
      ↓
Sala
      ↓
Lobby
      ↓
Roles
      ↓
Fases
      ↓
Votação
      ↓
Ações
      ↓
Game Engine
      ↓
Automação
      ↓
Polimento
```
