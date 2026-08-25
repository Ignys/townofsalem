# Town of Salem Board Game Companion — Roadmap de Continuação

> Continuação do projeto **a partir do estado alcançado na antiga ETAPA 30**.
>
> Este arquivo **não reinicia o projeto**. As novas etapas abaixo foram renumeradas a partir de 01 apenas para formar um novo roteiro de continuação.

---

# Nova direção do produto

O projeto passa a ser tratado prioritariamente como um **companheiro digital para uma partida presencial**, e não como uma versão digital do Town of Salem.

## Princípio principal

Durante a partida presencial:

### Jogadores

O jogador usa o site apenas para:

- ver sua própria role;
- consultar objetivo, descrição e interações da própria role;
- ver o timer/fase atual de forma simples;
- continuar conectado à sala após refresh/reconexão.

O jogador **não deve** usar o site para:

- escolher ação noturna;
- escolher alvo;
- enviar voto;
- votar Guilty/Innocent/Abstain;
- receber automaticamente o resultado secreto de investigação;
- controlar fases;
- visualizar o log do mestre;
- visualizar ações de outros jogadores.

As perguntas e respostas continuam acontecendo presencialmente, por exemplo:

> “Sheriff, acorde. Quem você quer investigar?”

O mestre escuta a resposta do jogador e registra a ação no próprio painel.

### Mestre / Host

O painel do mestre é o centro operacional da partida.

O mestre deve conseguir:

- ver todos os jogadores e suas roles;
- controlar qualquer fase livremente;
- controlar o timer;
- iniciar uma fase com duração predefinida;
- iniciar uma fase personalizada com duração escolhida na hora;
- ver quais roles precisam acordar durante a noite;
- registrar ações noturnas em um log estruturado;
- selecionar ator e alvo usando jogadores reais da sala;
- ter a ação sugerida automaticamente a partir da role;
- editar/corrigir ações antes de resolver a noite;
- pedir ao Game Engine uma prévia do resultado;
- ver uma explicação clara do que aconteceu;
- confirmar a aplicação das mortes/efeitos;
- corrigir erros administrativos sem depender de uma sequência rígida de fases.

---

# Mudanças em relação ao roadmap antigo

O código implementado nas antigas etapas 01–30 deve ser reaproveitado sempre que possível.

As seguintes decisões alteram o rumo das próximas etapas:

1. **A antiga máquina rígida de transições deixa de ser a regra do produto.**
   - O mestre poderá selecionar qualquer fase a qualquer momento.
   - `canTransition(from, to)` não deve impedir o host de operar a partida.

2. **As votações digitais implementadas até a antiga etapa 30 deixam de fazer parte do fluxo presencial principal.**
   - Não precisam ser apagadas imediatamente se estiverem bem isoladas.
   - Não devem continuar aparecendo na interface ativa dos jogadores.
   - Podem permanecer como código reutilizável para um futuro modo automatizado.

3. **A antiga etapa 32, em que o jogador enviaria a própria ação noturna, está cancelada para o modo principal.**
   - Todas as ações são registradas pelo mestre.

4. **A antiga etapa 33 deixa de ser um painel que recebe ações dos celulares e passa a ser um painel de condução da noite.**

5. **O Game Engine continua sendo importante**, mas recebe como entrada as ações registradas pelo mestre.

6. **Resultados privados não são enviados automaticamente ao jogador.**
   - O mestre recebe o resultado e comunica presencialmente quando a regra exigir.

7. Existem agora dois conceitos diferentes de log:
   - **Action Log**: caderno operacional editável da noite, usado como entrada do Game Engine;
   - **Event History**: histórico técnico/auditável de fatos já confirmados da partida.

Não misture os dois.

---

# Como usar este documento

1. Envie **um prompt por vez** para a IA que está trabalhando no repositório.
2. Antes de cada etapa, a IA deve inspecionar o código atual e aproveitar implementações existentes.
3. Não reimplementar etapas antigas sem necessidade.
4. Depois de cada etapa:
   - revisar o diff;
   - rodar testes/checks;
   - testar manualmente a funcionalidade quando aplicável;
   - fazer commit;
   - só então avançar.
5. Não permitir que a IA implemente etapas futuras “por conveniência”.
6. Regras não confirmadas da edição física devem permanecer configuráveis ou marcadas como pendentes; nunca inventar comportamento e apresentá-lo como oficial.
7. O Game Engine deve continuar independente de React, Next.js e Firebase.

---

# ETAPA 01 — Auditoria de migração para o modo presencial assistido

## Prompt

```text
Analise o estado ATUAL do repositório do Town of Salem Board Game Companion considerando que as antigas etapas 01–30 já foram executadas ou parcialmente executadas.

NÃO recomece o projeto e NÃO implemente funcionalidade nova nesta etapa.

O produto mudou de direção: agora o fluxo principal é uma partida presencial assistida pelo site.

Jogadores devem usar o site apenas para:
- ver sua própria role e seus detalhes;
- ver o timer/fase atual;
- permanecer conectados à sala.

O mestre será responsável por:
- controlar fases;
- conduzir a noite presencialmente;
- registrar as ações no painel;
- resolver a noite com auxílio do Game Engine.

Audite especialmente o código criado nas antigas etapas 24–30 e identifique:
1. máquina de estados das fases;
2. validações canTransition/getAllowedTransitions;
3. controle de fase no host;
4. timer;
5. controle alive/dead;
6. votação de acusação;
7. Trial;
8. votação Guilty/Innocent/Abstain;
9. paths Firebase relacionados a votes/actions/events;
10. componentes do jogador que hoje possuem interações além de role/timer.

Classifique cada parte como:
- REUTILIZAR;
- ADAPTAR;
- DESATIVAR NO MODO PRINCIPAL;
- REMOVER SOMENTE SE FOR CÓDIGO MORTO/INSEGURO.

Não apague votação ou helpers puros apenas porque não serão usados agora se eles estiverem isolados e puderem servir a um futuro modo automatizado.

Ao final:
- produza um resumo da arquitetura encontrada;
- liste os pontos que conflitam com o novo modo presencial;
- proponha quais arquivos serão afetados nas próximas etapas;
- rode os checks existentes;
- não implemente a migração ainda;
- pare.
```

---

# ETAPA 02 — Formalizar o modo presencial assistido como fluxo principal

## Prompt

```text
Implemente somente a mudança arquitetural que define o modo presencial assistido como fluxo principal do Town of Salem Board Game Companion.

Antes de editar, use a auditoria da etapa anterior e preserve tudo que já estiver funcional.

Objetivo:
separar claramente capacidades do jogador e capacidades do host.

Crie/ajuste tipos e documentação para representar que:

PLAYER CAPABILITIES:
- readOwnRole
- readTimer
- readCurrentPhaseLabel, caso o timer mostre o nome da fase

HOST CAPABILITIES:
- readAllRoles
- controlPhase
- controlTimer
- managePlayers
- recordNightActions
- resolveNight
- confirmResolution
- correctAdministrativeState

Não é obrigatório criar literalmente um enum de capabilities se a arquitetura existente tiver solução mais simples, mas a separação deve ficar clara no domínio e na documentação.

Atualize docs/town-of-salem-companion.md ou documentação equivalente para registrar:
- o site NÃO substitui a interação presencial;
- votos e ações do jogador não fazem parte do modo principal;
- o host é a fonte de verdade para as decisões comunicadas presencialmente.

Não redesenhe telas ainda.
Não implemente Action Log ainda.
Não implemente Game Engine novo ainda.

Rode checks e pare.
```

---

# ETAPA 03 — Simplificar a interface ativa do jogador

## Prompt

```text
Adapte somente a interface DURANTE A PARTIDA do jogador para o novo modo presencial assistido.

O jogador deve ver apenas:
- timer atual;
- nome da fase junto do timer, se isso ajudar a contextualização;
- sua própria role;
- faction/alignment quando apropriado;
- objetivo;
- descrição;
- descrição beginner/experienced conforme o perfil já existente;
- interações/regras adicionais da própria role quando presentes no catálogo.

Remova da interface ativa do jogador:
- votação de acusação;
- Guilty/Innocent/Abstain;
- seleção de alvo noturno;
- envio de night action;
- status “ação enviada”;
- qualquer resultado automático de investigação;
- controles administrativos.

IMPORTANTE:
- não exponha privatePlayers de terceiros;
- não apague necessariamente módulos puros de votação já implementados;
- se componentes antigos de votação ficarem sem uso, mantenha-os isolados ou remova apenas quando estiver seguro que não quebrará funcionalidades futuras/documentadas;
- jogador morto continua podendo consultar sua própria role e timer.

A tela deve ficar extremamente simples e adequada para permanecer aberta sobre a mesa durante uma partida presencial.

Rode checks e pare.
```

---

# ETAPA 04 — Substituir a máquina rígida por seleção livre de fase

## Prompt

```text
Refatore somente o domínio de fases para remover a obrigatoriedade de transições lineares.

Hoje pode existir lógica semelhante a:
- day -> discussion
- discussion -> trial/night
- trial -> defense
- defense -> verdict
- verdict -> ...
- night -> day

Esse bloqueio NÃO deve mais governar o host.

O mestre deve poder selecionar qualquer fase ativa a qualquer momento.

Mantenha fases predefinidas equivalentes às já existentes, por exemplo:
- day
- discussion
- trial
- defense
- verdict
- night

Lobby e game-over podem continuar sendo tratados como estados/status administrativos separados se isso deixar a arquitetura mais clara.

Crie uma definição central de fases, algo equivalente a PhaseDefinition, contendo pelo menos:
- id;
- label;
- defaultDurationSeconds opcional/configurável;
- hasTimer;
- category ou metadata apenas se houver necessidade real.

A duração padrão NÃO deve ser inventada como regra oficial.
Reutilize os valores atuais caso já existam ou deixe-os configuráveis.

A antiga função canTransition não pode mais impedir o host.
Se ela for útil para um futuro modo automatizado, preserve-a fora do fluxo principal.

Não faça ainda o novo painel visual.
Crie testes do novo comportamento de seleção livre.
Rode checks e pare.
```

---

# ETAPA 05 — Mini painel de fases do mestre

## Prompt

```text
Implemente somente o novo mini painel de fases no dashboard do host.

O painel deve ficar sempre acessível durante a partida e mostrar TODAS as fases predefinidas simultaneamente.

Exemplo conceitual:
[ Dia ] [ Discussão ] [ Trial ] [ Defesa ] [ Veredito ] [ Noite ] [ Personalizado ]

Requisitos:
- fase atual claramente destacada;
- qualquer fase pode ser selecionada a qualquer momento;
- nenhuma opção deve desaparecer por causa da fase atual;
- não usar dropdown escondido como interação principal se houver espaço para botões compactos;
- funcionar bem em desktop/tablet e continuar utilizável em mobile;
- ao selecionar uma fase predefinida, usar a duração configurada daquela fase;
- “Personalizado” deve abrir um controle simples para escolher a duração;
- opcionalmente permitir um nome curto para a fase personalizada, sem tornar isso obrigatório.

A seleção deve ser ação exclusiva do host.

Ainda não implemente histórico de fases complexo.
Ainda não implemente Action Log.

Rode checks e pare.
```

---

# ETAPA 06 — Integrar fase e timer como uma única operação administrativa

## Prompt

```text
Integre somente o novo painel livre de fases ao timer existente.

Objetivo:
ao escolher uma fase, o host deve conseguir iniciar imediatamente aquela fase com seu timer correspondente.

Para fases predefinidas:
- usar defaultDurationSeconds configurado;
- persistir timestamp absoluto phaseEndsAt;
- manter suporte existente a pause/resume quando aplicável;
- manter +30 segundos se já existir;
- manter encerramento manual.

Para fase personalizada:
- host escolhe minutos/segundos;
- validar duração maior que zero e dentro de um limite razoável definido pela aplicação;
- criar a sessão com a duração escolhida.

A mudança de fase + início/reset do timer devem ser persistidos de forma atômica sempre que possível para evitar UI inconsistente.

Não avance automaticamente para outra fase quando o timer zerar.
Ao zerar:
- mostrar “tempo encerrado”;
- aguardar o mestre escolher o que fazer.

Jogadores apenas observam o timer em tempo real.

Crie testes dos cálculos de timer e da criação de fase customizada.
Rode checks e pare.
```

---

# ETAPA 07 — Criar sessões de fase e identidade estável para cada noite

## Prompt

```text
Implemente somente a infraestrutura de PhaseSession/NightSession necessária para que o novo controle livre de fases não destrua o histórico da partida.

Problema:
o host agora pode trocar de fase livremente. Portanto, não devemos identificar dados apenas por phase = "night".

Cada ativação relevante de fase deve poder possuir um identificador estável, por exemplo:
- phaseSessionId;
- phaseId;
- startedAt;
- durationSeconds;
- endsAt;
- sequenceNumber.

Para noites, mantenha também:
- nightId ou nightSessionId;
- nightNumber apenas para exibição humana.

As ações futuras da noite devem ser vinculadas ao nightId/nightSessionId, não apenas a uma string "night".

Requisitos:
- iniciar uma nova Noite cria uma nova NightSession;
- dados de noites anteriores não são sobrescritos;
- phase switching livre continua permitido;
- não criar automaticamente uma nova noite quando apenas pausar/retomar o timer;
- permitir ao host identificar claramente “Noite 1”, “Noite 2”, etc.

Não implemente ações ainda.
Rode testes e pare.
```

---

# ETAPA 08 — Adaptar schema Firebase e Security Rules ao host-assisted mode

## Prompt

```text
Adapte somente o schema lógico do Firebase Realtime Database e as Security Rules para o novo modo presencial assistido.

Antes de alterar, leia o schema atual e faça a menor migração coerente.

O objetivo é preparar paths equivalentes a:

games/{gameId}/
  public/
    phase...
    timer...
  phaseSessions/{phaseSessionId}/...
  nightSessions/{nightId}/...
  hostNightActions/{nightId}/{actionEntryId}/...
  hostNotes/{nightId}/{noteId}/...
  nightResolutions/{nightId}/...
  events/{eventId}/...

Os nomes exatos podem ser adaptados à arquitetura existente.

Regras conceituais:
- jogadores podem ler somente os dados públicos necessários;
- jogador lê apenas seu próprio privatePlayer;
- jogador NÃO escreve hostNightActions;
- jogador NÃO lê hostNightActions;
- somente host lê/escreve Action Log;
- somente host lê preview/resolution administrativa;
- votos digitais existentes não devem continuar sendo requisito para o modo principal;
- se os paths de votes forem preservados para futuro modo automatizado, mantenha-os protegidos e sem UI ativa.

Atualize docs/firebase-schema.md.

Não crie UI nova nesta etapa.
Valide rules na medida possível.
Rode checks e pare.
```

---

# ETAPA 09 — Estender RoleDefinition para condução presencial da noite

## Prompt

```text
Estenda somente o catálogo/tipos de roles para fornecer ao painel do mestre os metadados necessários para conduzir uma noite presencial.

Não implemente o Game Engine completo ainda.

RoleDefinition/ActionDefinition deve conseguir representar, quando aplicável:
- wakesAtNight;
- wakeOrder ou wakePriority de apresentação;
- wakeGroupId opcional;
- wakeGroupLabel opcional;
- actionDefinitions;
- actionId;
- actionLabel;
- actionVerb;
- targetCount;
- allowedTargetType;
- allowSelfTarget;
- allowDeadTarget quando aplicável;
- requiresTarget;
- sharedFactionAction quando aplicável;
- engineEffectType futuro;
- interaction metadata já confirmada pelo projeto.

Exemplos conceituais de actionVerb:
- investiga
- cura
- ataca
- limpa
- bloqueia

Isso permitirá construir frases como:
- Fulano — Sheriff — investiga — João
- Ciclano — Doctor — cura — João
- Caim — Mafioso — ataca — João
- Abel — Janitor — limpa — João

IMPORTANTE:
- não invente ações para roles cujas regras ainda não estejam confirmadas;
- quando uma role possuir mais de uma ação possível, modele múltiplas ActionDefinitions;
- quando uma facção acordar junta, use wakeGroupId em vez de hardcode na UI;
- o texto de exibição deve vir dos dados da role/action, não de vários ifs em componentes.

Adicione testes do catálogo.
Rode checks e pare.
```

---

# ETAPA 10 — Gerador puro da lista de quem acorda à noite

## Prompt

```text
Implemente somente uma função pura que gere o plano de condução da noite para o mestre.

Entrada:
- jogadores da partida;
- assignments de roles;
- catálogo de RoleDefinitions;
- night context necessário.

Saída:
uma lista ordenada de NightWakeItems/NightWakeGroups.

Exemplos conceituais:
- Fulano — Sheriff
- Ciclano — Doctor
- Adão, Caim e Abel — Mafia

Requisitos:
- incluir apenas roles que acordam à noite;
- por padrão incluir apenas jogadores vivos;
- agrupar jogadores quando suas RoleDefinitions compartilharem wakeGroupId;
- mostrar membros do grupo com nome e role internamente;
- ordenar por wakeOrder/wakePriority definida no catálogo;
- não codificar nomes específicos de jogadores;
- não hardcode “Mafia” no algoritmo: o agrupamento vem de metadata;
- resultado determinístico;
- não acessar Firebase;
- não importar React.

Se regras como “role morta ainda age” existirem no futuro, a função deve ser extensível sem assumir isso agora.

Crie testes incluindo:
- roles diurnas ignoradas;
- jogador morto ignorado;
- agrupamento de facção;
- ordem previsível.

Pare após os testes.
```

---

# ETAPA 11 — Checklist de condução da noite no painel do mestre

## Prompt

```text
Implemente somente a interface do host que mostra a lista de quem precisa acordar durante a NightSession atual.

Use o gerador puro da etapa anterior.

Cada item deve mostrar:
- nome do jogador + role;
OU, quando agrupado:
- nomes dos jogadores + nome do grupo/facção;
- roles dos membros acessíveis ao expandir/detalhar.

Cada item deve possuir estado operacional local/persistido equivalente a:
- pending;
- completed;
- skipped.

Objetivo de UX:
o mestre olha a lista de cima para baixo enquanto conduz verbalmente a noite.

Ao clicar em um item:
- abrir/preparar o compositor de ação da próxima etapa;
- não enviar nada para o jogador;
- não resolver automaticamente.

Mostrar progresso simples, por exemplo:
3 de 7 passos registrados.

Não implemente ainda o formulário completo do Action Log.
Rode checks e pare.
```

---

# ETAPA 12 — Modelo estruturado do Action Log da noite

## Prompt

```text
Implemente somente o modelo de domínio do Action Log do mestre.

Esse log é a fonte de verdade das decisões comunicadas presencialmente durante a noite.

Crie um tipo equivalente a HostNightActionEntry contendo pelo menos:
- id;
- nightId;
- actorUid;
- roleIdSnapshot;
- actionId;
- targetUids;
- createdAt;
- updatedAt;
- status;
- optionalNotes.

Status pode contemplar algo simples como:
- draft;
- confirmed;
- cancelled;

Se houver ações de múltiplos alvos, targetUids deve suportar isso.

A FRASE humana não deve ser a única fonte de verdade.
Exemplo:
"Fulano — Sheriff — investiga — João"
deve ser derivado dos campos estruturados.

Crie helpers puros para:
- formatHostActionEntry(entry, context);
- validar shape básico;
- obter actor/targets;
- obter ActionDefinition correspondente.

Não persistir ainda.
Não resolver a noite ainda.
Crie testes e pare.
```

---

# ETAPA 13 — Compositor inteligente de ação do mestre

## Prompt

```text
Implemente somente a UI para o mestre criar uma entrada estruturada no Action Log.

Fluxo principal:
1. mestre seleciona o jogador/ator;
2. o selector deve mostrar "Nome — Role";
3. a aplicação consulta a RoleDefinition daquele jogador;
4. se existir exatamente uma ação aplicável, selecioná-la automaticamente;
5. mostrar a frase parcial, por exemplo:
   "Fulano — Sheriff — investiga — ..."
6. mostrar selector(es) de alvo conforme targetCount;
7. mestre confirma a entrada.

Exemplos:
- Fulano — Sheriff — investiga — [selecionar jogador]
- Ciclano — Doctor — cura — [selecionar jogador]
- Caim — Mafioso — ataca — [selecionar jogador]
- Abel — Janitor — limpa — [selecionar jogador]

Se uma role tiver múltiplas ações possíveis:
- mostrar selector de ação antes do alvo.

Se a ação não exige alvo:
- não mostrar selector vazio.

Selectors devem respeitar apenas regras JÁ MODELADAS, como:
- self target;
- alvo vivo/morto;
- quantidade de alvos.

Não invente regras ausentes.

Quando a ação for aberta a partir do Night Wake Checklist:
- pré-selecione ator/grupo quando possível;
- reduza cliques desnecessários.

Ainda não execute Game Engine.
Rode checks e pare.
```

---

# ETAPA 14 — Persistência, edição e correção do Action Log

## Prompt

```text
Integre somente o Action Log ao Firebase para o host.

Requisitos:
- entries ficam vinculadas ao nightId atual;
- somente o host pode ler/escrever;
- salvar nova ação;
- editar ator/ação/alvos antes da resolução;
- excluir/cancelar entrada antes da resolução;
- impedir double submit acidental;
- sobreviver a refresh;
- atualizar a UI em tempo real se o painel estiver aberto em mais de uma aba autorizada do host;
- ordenar por createdAt ou ordem operacional clara.

Quando uma ação for salva:
- atualizar o item correspondente do Night Wake Checklist para completed quando fizer sentido;
- não marcar grupos inteiros como completos se ainda existirem ações individuais pendentes configuradas.

Mostre o Action Log em formato compacto e legível.

Exemplo visual:
1. Fulano — Sheriff — investiga — João
2. Ciclano — Doctor — cura — João
3. Caim — Mafioso — ataca — João
4. Abel — Janitor — limpa — João

Não resolva automaticamente.
Atualize Security Rules se necessário.
Rode checks e pare.
```

---

# ETAPA 15 — Notas manuais do mestre para exceções

## Prompt

```text
Adicione somente um sistema pequeno de notas manuais do host por NightSession.

Objetivo:
permitir registrar situações que ainda não possuem ActionDefinition estruturada ou observações úteis sem corromper o Action Log.

Exemplos:
- "Jogador pediu para confirmar alvo"
- "Repetir investigação antes de encerrar"
- "Interação ainda não modelada no engine"

Requisitos:
- notas são host-only;
- ficam separadas de HostNightActionEntry;
- possuem timestamp;
- podem ser editadas/removidas antes de encerrar a noite;
- NÃO entram automaticamente no Game Engine;
- UI deve deixar evidente a diferença entre "Ação" e "Nota".

Não transforme isso em chat.
Rode checks e pare.
```

---

# ETAPA 16 — Validação pura das ações registradas pelo mestre

## Prompt

```text
Implemente somente a camada de validação de HostNightActionEntry antes da futura resolução.

Crie uma função pura equivalente a:
validateHostNightAction(entry, gameState, roleDefinitions)

Ela deve retornar erros estruturados.

Validar quando a regra estiver disponível:
- actor existe;
- actor possui a role snapshot esperada;
- actionId pertence à role;
- quantidade correta de alvos;
- target existe;
- alive/dead targeting;
- self targeting;
- targets duplicados quando proibido;
- NightSession correta;
- ação não está cancelled.

Não invente restrições ausentes.
Quando uma regra ainda não estiver modelada, retorne warning/unknown quando útil em vez de fingir certeza.

Integre a validação à UI do host:
- erro bloqueante impede confirmar ação;
- warning pode ser exibido claramente ao mestre.

Crie testes.
Rode checks e pare.
```

---

# CHECKPOINT A — Condução presencial da noite sem resolução automática

Neste ponto deve ser possível:

- jogadores entrarem e verem somente role + timer;
- mestre escolher qualquer fase livremente;
- mestre iniciar timer predefinido ou personalizado;
- iniciar uma NightSession;
- ver quem precisa acordar;
- conduzir verbalmente cada role;
- registrar ações estruturadas;
- editar/corrigir o log;
- manter notas administrativas;
- recarregar a página sem perder o andamento.

Faça um playtest manual antes de começar o Game Engine.

---
# ETAPA 17 — Fundação do Game Engine adaptada ao Action Log do host

## Prompt

```text
Implemente somente a fundação independente do Game Engine para receber as ações registradas pelo mestre.

Se src/game-engine já existir por alguma implementação antecipada, adapte e preserve o que estiver correto.

O engine NÃO pode importar:
- React;
- Next.js;
- Firebase.

Defina estruturas imutáveis equivalentes a:
- GameState;
- EnginePlayer;
- EngineRole;
- EngineNightAction;
- NightResolution;
- EngineEvent;
- EngineWarning.

Crie adapters PUROS, fora do Firebase, capazes de converter HostNightActionEntry validado para EngineNightAction.

Crie uma função estrutural:
resolveNight(gameState, actions, rulesContext)

Por enquanto ela pode:
- validar entrada;
- normalizar ações;
- retornar estrutura de resolução vazia;
- retornar warnings para efeitos ainda não suportados.

Requisitos:
- determinístico;
- sem I/O;
- sem Date.now interno quando puder ser injetado;
- sem efeitos colaterais;
- nenhuma escrita em Firebase;
- testes unitários.

Não implemente ataque/defesa ainda.
Pare após os testes.
```

---

# ETAPA 18 — Registro genérico de efeitos de ações

## Prompt

```text
Implemente somente a infraestrutura que conecta ActionDefinitions das roles a efeitos genéricos do Game Engine.

Objetivo:
evitar lógica como:
if (role === "Doctor") ...
if (role === "Sheriff") ...
if (role === "Mafioso") ...

O engine deve receber ações e efeitos declarativos.

Crie tipos/registro equivalentes a EngineEffectType, contemplando somente categorias necessárias e confirmadas, por exemplo:
- protect;
- investigate;
- attack;
- roleblock;
- clean;
- redirect futuramente;
- status-effect futuramente.

ActionDefinition deve conseguir apontar para o efeito que produz.

Crie funções que:
- encontrem a definição da ação;
- transformem EngineNightAction em um ou mais efeitos;
- retornem unsupported/warning para ação ainda não modelada.

Não implemente todos os efeitos nesta etapa.
Não invente regras específicas.
Crie testes do registro e pare.
```

---

# ETAPA 19 — Sistema central de ataque e defesa

## Prompt

```text
Implemente somente o módulo de ataque e defesa do Game Engine.

Reutilize AttackLevel/DefenseLevel existentes se já estiverem no projeto.

O módulo deve:
- receber ataque;
- receber defesa efetiva do alvo;
- retornar resultado estruturado;
- não conhecer nomes de roles.

Exemplo de retorno:
{
  success,
  attackLevel,
  defenseLevel,
  reasonCode
}

A hierarquia entre níveis deve vir de uma tabela/regra central já confirmada pelo projeto.
Se o projeto ainda não possuir a relação oficial/confirmada, modele a tabela de forma configurável e não invente defaults apresentados como oficiais.

Crie testes para todas as combinações efetivamente suportadas.
Não integrar Firebase.
Pare.
```

---

# ETAPA 20 — Priority Pipeline independente da ordem do Action Log

## Prompt

```text
Implemente somente o pipeline genérico de prioridade da resolução noturna.

IMPORTANTE:
a ordem em que o mestre registrou as ações no Action Log serve para organização humana, mas NÃO pode determinar por acidente a ordem mecânica de resolução.

Crie:
- ActionPriority ou mecanismo equivalente;
- função para ordenar efeitos;
- pipeline determinístico.

Categorias possíveis, somente quando confirmadas/modeladas:
- roleblock;
- redirect;
- protect;
- investigate;
- attack;
- post-attack;
- clean/post-death.

A prioridade real deve vir de configuração/ActionDefinition e das regras confirmadas do projeto.
Não apresente uma ordem provisória como oficial.

Crie testes provando que:
- registrar ações em ordens diferentes produz a mesma resolução;
- empates de prioridade possuem desempate determinístico quando necessário.

Não implemente todos os efeitos ainda.
Pare após os testes.
```

---

# ETAPA 21 — Proteção e roleblock

## Prompt

```text
Implemente somente os efeitos genéricos de proteção e roleblock no Game Engine.

Proteção deve conseguir:
- aplicar defesa/efeito temporário ao alvo;
- participar da resolução de ataques;
- gerar eventos/reasonCodes estruturados.

Roleblock deve conseguir:
- marcar ação elegível como bloqueada;
- impedir que seu efeito seja aplicado quando a regra confirmada determinar isso;
- registrar motivo estruturado.

Não use nomes de roles dentro dos resolvers genéricos.
Roles produzem efeitos; o engine resolve efeitos.

Implemente somente interações confirmadas.
Para interações desconhecidas:
- warning;
- TODO explícito;
- teste pendente quando apropriado.

Crie testes unitários e pare.
```

---

# ETAPA 22 — Investigações e aparência investigativa

## Prompt

```text
Implemente somente a infraestrutura de investigação no Game Engine.

Objetivo:
o mestre registrar algo como:
"Fulano — Sheriff — investiga — João"
e o engine retornar ao HOST qual resultado deve ser informado presencialmente.

Crie conceitos equivalentes a:
- InvestigationType;
- InvestigationResult;
- investigativeAppearance / result mapping;
- modifiers de aparência quando necessários.

IMPORTANTE:
o resultado não pode ser inferido apenas da faction real se as regras possuírem exceções.

O sistema deve conseguir representar interações como:
- uma role que normalmente pertence a determinada facção, mas aparece como suspeita/inocente de forma especial;
- disfarces ou modificadores futuros;
- tipos diferentes de investigação.

Somente implemente mappings confirmados no catálogo/documentação do projeto.
Não invente o resultado de Sheriff, Investigator, Consigliere ou outras roles se a regra ainda não estiver registrada.

O retorno deve ser destinado ao host, não ao celular do jogador.

Crie testes específicos para cada mapping confirmado e pelo menos um caso de exceção de aparência investigativa quando houver uma regra confirmada no projeto.
Pare.
```

---

# ETAPA 23 — Ataques, sobrevivência e mortes potenciais

## Prompt

```text
Implemente somente a resolução genérica de ataques após os efeitos relevantes da pipeline.

Requisitos:
- usar exclusivamente o módulo central de attack/defense;
- suportar múltiplos ataques contra o mesmo alvo;
- considerar proteções já aplicadas;
- produzir eventos estruturados;
- distinguir ataque tentado de morte efetiva;
- retornar deaths potenciais sem alterar Firebase;
- retornar survivals/protections relevantes para o resumo do host.

Exemplos de reasonCodes conceituais:
- ATTACK_SUCCEEDED;
- ATTACK_BLOCKED_BY_DEFENSE;
- TARGET_PROTECTED;
- MULTIPLE_ATTACKS;

Use nomes melhores se já existir padrão no projeto.

Não escreva frases finais diretamente como fonte de verdade; produza dados estruturados para a camada de apresentação.

Crie testes compostos.
Pare.
```

---

# ETAPA 24 — Efeitos pós-ataque e limpeza de corpo

## Prompt

```text
Implemente somente a infraestrutura de efeitos pós-ataque/pós-morte necessária para ações como limpeza de corpo, quando essa regra estiver confirmada no projeto.

Objetivo arquitetural:
permitir registrar uma ação como:
"Abel — Janitor — limpa — João"
e fazer o engine aplicar o efeito SOMENTE se as condições reais da regra forem satisfeitas.

Crie um conceito genérico equivalente a postDeathEffect/cleanEffect sem hardcode de UI.

O resultado deve conseguir representar, quando confirmado:
- alvo morreu;
- alvo recebeu clean;
- clean falhou porque as condições não foram satisfeitas;
- informação que deve ficar oculta/revelada no fim conforme regra/configuração.

Não invente comportamento do Janitor ou de qualquer role específica.
Use somente a regra já documentada no projeto.
Se ela ainda estiver incompleta, implemente apenas a infraestrutura e retorne unsupported/warning.

Crie testes para interações confirmadas.
Pare.
```

---

# ETAPA 25 — Resolver completo da noite para o conjunto de regras já modelado

## Prompt

```text
Complete o resolveNight SOMENTE para os efeitos que já foram confirmados e implementados nas etapas anteriores.

Fluxo esperado:
1. validar ações;
2. normalizar;
3. gerar efeitos;
4. ordenar por prioridade;
5. aplicar roleblocks;
6. aplicar redirects apenas se já existirem;
7. aplicar proteções;
8. calcular investigações no contexto correto;
9. aplicar ataques;
10. determinar mortes;
11. aplicar efeitos pós-morte confirmados;
12. gerar resultados destinados ao host;
13. gerar eventos estruturados;
14. gerar warnings para ações ainda não suportadas.

NightResolution deve conter estrutura suficiente para a UI produzir pelo menos:
- deaths;
- survivors relevantes;
- investigationResults;
- appliedEffects;
- blockedActions;
- failedActions;
- warnings;
- engineEvents.

Requisitos:
- mesmas entradas => mesma saída;
- nenhuma dependência de Firebase;
- nenhum side effect;
- cobertura de cenários compostos;
- bugs encontrados viram testes.

Não implemente novas roles só para preencher o resolver.
Rode testes e pare.
```

---

# ETAPA 26 — Preview de resolução no painel do mestre

## Prompt

```text
Integre somente o Game Engine ao painel do host em modo PREVIEW.

Fluxo:
1. obter snapshot consistente da NightSession atual;
2. carregar HostNightActionEntries confirmadas;
3. validar ações;
4. converter para GameState/EngineNightAction;
5. executar resolveNight;
6. mostrar preview ao host;
7. NÃO persistir mortes/efeitos ainda.

O preview deve destacar:
- ações inválidas;
- warnings;
- mortes previstas;
- pessoas atacadas mas sobreviventes;
- resultados de investigação que o mestre precisa informar;
- efeitos especiais suportados;
- ações bloqueadas/falhas.

Se houver ação ainda não modelada:
- não fingir uma resolução completa;
- mostrar claramente que o resultado automático é parcial.

O botão deve se chamar de forma equivalente a:
- “Pré-visualizar resultado da noite”

Não avançar fase automaticamente.
Não matar jogadores automaticamente.
Rode checks e pare.
```

---

# ETAPA 27 — Resumo humano e explicação causal da noite

## Prompt

```text
Implemente somente a camada de apresentação do NightResolution para o mestre.

Objetivo:
transformar os dados estruturados do engine em uma leitura muito rápida durante a partida presencial.

O resumo principal deve conseguir mostrar frases equivalentes a:
- “Ninguém morreu esta noite.”
- “João morreu.”
- “João foi atacado, mas sobreviveu por causa de uma proteção.”
- “Fulano investigou João: resultado que deve ser informado = SUSPEITO.”

Não use texto livre como fonte de verdade.
As frases devem ser derivadas de reasonCodes/events estruturados.

Crie duas camadas visuais:

1. RESUMO
- mortes;
- ninguém morreu;
- resultados que o host precisa comunicar;
- warnings importantes.

2. DETALHES / POR QUE ISSO ACONTECEU
- ação A;
- efeito B;
- proteção C;
- ataque bloqueado/sucedido;
- cadeia causal relevante.

Isso serve para o mestre conferir rapidamente se registrou tudo certo antes de confirmar.

Não aplique o resultado ainda.
Crie testes da transformação de reasonCodes em apresentação quando viável.
Pare.
```

---

# ETAPA 28 — Confirmar e aplicar a resolução da noite

## Prompt

```text
Implemente somente a aplicação CONFIRMADA do NightResolution à partida real.

Fluxo:
1. host gera preview;
2. host revisa;
3. host clica em “Confirmar resultado”;
4. aplicação persiste os efeitos suportados.

Persistir de forma atômica quando possível:
- alive/dead;
- statuses confirmados;
- clean/efeitos persistentes quando aplicável;
- nightResolutions/{nightId};
- flag de resolução aplicada;
- eventos auditáveis.

Requisitos de segurança:
- apenas host aplica;
- mesma NightSession não pode ser aplicada duas vezes acidentalmente;
- criar resolutionId/idempotencyKey;
- preview antigo não pode ser confirmado se as ações mudaram depois que ele foi gerado sem uma nova validação;
- não avançar fase automaticamente;
- não enviar resultados secretos ao jogador.

Após aplicar:
- Action Log daquela noite fica bloqueado para edição comum;
- correções passam pelo fluxo administrativo da próxima etapa.

Atualize Security Rules se necessário.
Rode checks e pare.
```

---

# ETAPA 29 — Correção e rollback administrativo da última resolução

## Prompt

```text
Implemente somente um fluxo seguro para o mestre corrigir um erro logo após aplicar a resolução de uma noite.

Problema real:
o mestre pode registrar o alvo errado e perceber isso depois de confirmar.

Objetivo:
evitar que a única solução seja editar Firebase manualmente.

Implemente um mecanismo de rollback/reopen para a NightSession mais recente.

Requisitos:
- somente host;
- confirmação explícita;
- registrar que houve rollback no Event History;
- restaurar somente os campos alterados por aquela resolução;
- não apagar silenciosamente o histórico anterior;
- permitir editar o Action Log depois de reabrir;
- exigir novo preview antes de confirmar novamente;
- impedir rollback inseguro se já existirem alterações posteriores incompatíveis, a menos que haja mecanismo confiável de snapshot.

Prefira persistir um patch/snapshot mínimo dos campos tocados pela resolução em vez de copiar a partida inteira sem necessidade.

Crie testes de idempotência e rollback.
Pare.
```

---

# ETAPA 30 — Roster operacional do mestre e overrides administrativos

## Prompt

```text
Aprimore somente a lista administrativa de jogadores do host para uso durante a partida presencial.

O host já deve possuir acesso a jogador + role. Transforme isso em um roster operacional compacto.

Mostrar:
- nome;
- role;
- faction/alignment quando útil;
- vivo/morto;
- conectado/desconectado quando disponível;
- status especiais persistentes relevantes e seguros para o host.

Permitir ao host:
- marcar vivo/morto manualmente para corrigir eventos presenciais;
- reviver por correção administrativa;
- corrigir status suportados;
- abrir rapidamente o compositor de ação daquele jogador durante a noite.

Ações destrutivas precisam de confirmação.
Overrides manuais devem gerar Event History administrativo.

Não automatize vitória nesta etapa.
Não exponha o roster completo aos jogadores.
Rode checks e pare.
```

---

# CHECKPOINT B — Noite presencial assistida completa

Neste ponto o mestre deve conseguir:

- iniciar uma noite;
- ver a ordem de quem acorda;
- chamar as roles presencialmente;
- registrar ator/ação/alvo;
- corrigir entradas;
- resolver a noite;
- entender por que o engine chegou ao resultado;
- confirmar mortes/efeitos;
- desfazer uma resolução recente em caso de erro;
- seguir para qualquer fase manualmente.

O jogador continua sem enviar nenhuma ação pelo site.

---

# ETAPA 31 — Condições de vitória como assistência, não como autoridade automática

## Prompt

```text
Implemente somente o módulo puro de condições de vitória, adaptado ao modo presencial assistido.

Crie/reutilize:
checkWinCondition(gameState)

Retorno estruturado equivalente a:
{
  gameOver,
  winningFactions,
  winningPlayerUids,
  reasonCode,
  confidenceOrWarnings
}

Requisitos:
- regras modulares por facção/role;
- neutrals especiais extensíveis;
- somente condições confirmadas;
- não hardcode em componentes;
- não encerrar a partida automaticamente.

No painel do host, o resultado deve aparecer como sugestão:
“Possível condição de vitória atingida.”

O mestre decide se confirma o encerramento.

Crie testes para condições confirmadas.
Pare.
```

---

# ETAPA 32 — Game Over confirmado pelo mestre

## Prompt

```text
Integre somente o encerramento da partida ao fluxo presencial assistido.

O Game Engine/checkWinCondition pode sugerir que a partida terminou, mas o host deve confirmar.

Host também pode encerrar manualmente por necessidade administrativa.

Ao confirmar Game Over:
- persistir status game-over;
- registrar vencedores quando conhecidos;
- encerrar timers ativos;
- bloquear novas resoluções normais;
- manter logs/histórico acessíveis ao host;
- manter a tela final simples para jogadores.

Tela do jogador pode mostrar:
- partida encerrada;
- vencedor(es) conforme configuração;
- revelação final de roles somente se a configuração permitir.

Não transformar o fim em uma animação complexa.
Rode checks e pare.
```

---

# ETAPA 33 — Event History imutável separado do Action Log

## Prompt

```text
Implemente somente o histórico estruturado e auditável dos fatos CONFIRMADOS da partida.

IMPORTANTE:
Event History NÃO é o Action Log editável da noite.

Action Log:
- representa intenções/ações registradas pelo mestre;
- pode ser corrigido antes da resolução.

Event History:
- registra o que efetivamente aconteceu no sistema;
- deve ser append-oriented/imutável na medida prática.

Eventos possíveis:
- PLAYER_JOINED;
- GAME_STARTED;
- ROLE_ASSIGNED;
- PHASE_STARTED;
- PHASE_CHANGED;
- TIMER_PAUSED;
- HOST_ACTION_RECORDED, se útil tecnicamente;
- NIGHT_PREVIEW_GENERATED, somente se não gerar ruído excessivo;
- NIGHT_RESOLUTION_APPLIED;
- NIGHT_RESOLUTION_ROLLED_BACK;
- PLAYER_DIED;
- PLAYER_REVIVED_BY_HOST;
- PLAYER_STATUS_CHANGED;
- GAME_ENDED.

Requisitos:
- timestamp;
- actor/admin uid quando relevante;
- payload tipado;
- visibility host-only/public quando necessário;
- dados secretos nunca em log público.

Crie uma timeline técnica simples para o host.
Não transforme em analytics.
Rode checks e pare.
```

---

# ETAPA 34 — Histórico por noite para consulta rápida do mestre

## Prompt

```text
Implemente somente uma visão de histórico das noites anteriores no painel do host.

Objetivo:
o mestre conseguir responder rapidamente “o que aconteceu na Noite 2?” sem procurar eventos brutos.

Para cada NightSession encerrada, mostrar:
- Noite N;
- Action Log final daquela noite;
- resolução confirmada;
- mortes;
- principais efeitos;
- resultados de investigação destinados ao host;
- warnings que existiam;
- indicação se houve rollback/correção.

Permitir expandir detalhes, mas manter o resumo compacto.

Dados de noites antigas devem ser somente leitura no fluxo normal.
Correções devem usar o mecanismo administrativo apropriado, não edição silenciosa do histórico.

Não implementar estatísticas agregadas ainda.
Rode checks e pare.
```

---
# ETAPA 35 — Presets de composição

## Prompt

```text
Implemente somente presets de composição de partida, reaproveitando a infraestrutura de seleção de roles já existente.

Crie uma estrutura de dados tipada para presets.

O host deve conseguir:
- selecionar um preset;
- visualizar a composição resultante;
- editar manualmente depois;
- voltar para composição manual.

IMPORTANTE:
- não invente listas “oficiais”;
- use apenas presets validados pela documentação/regras fornecidas ao projeto;
- presets experimentais devem ser identificados como custom/experimental.

Presets NÃO devem alterar a filosofia presencial do aplicativo.
Eles servem apenas para preparar a partida.

Não implemente score de balanceamento nesta etapa.
Rode checks e pare.
```

---

# ETAPA 36 — Gerador de composição por slots/categorias

## Prompt

```text
Implemente somente o gerador puro de composição baseado em slots/categorias.

Reutilize o catálogo de roles e alignments já existentes.

O algoritmo deve:
- receber quantidade de jogadores;
- receber slots/categorias configuradas;
- receber catálogo elegível;
- resolver cada slot;
- respeitar duplicações/restrições confirmadas;
- aceitar RNG injetável;
- não mutar os argumentos;
- retornar erro estruturado quando não for possível montar a composição.

Categorias devem vir da taxonomia confirmada no projeto.
Não invente restrições ou categorias oficiais.

Crie testes determinísticos.
Integre ao host somente depois dos testes passarem.
Pare.
```

---

# ETAPA 37 — Score experimental de balanceamento

## Prompt

```text
Implemente somente uma infraestrutura EXPERIMENTAL de score de balanceamento da composição.

Esse recurso é uma heurística e NÃO pode alegar que determina objetivamente se a partida é justa.

Crie:
- pesos configuráveis por role;
- cálculo por facção;
- score agregado/normalizado opcional;
- detalhamento dos fatores usados;
- possibilidade de desativar o recurso.

Se não houver pesos validados:
- não invente valores de produção;
- use fixtures de teste claramente identificadas como experimentais ou deixe a configuração sem defaults.

Na UI do host use rótulo equivalente a:
“Estimativa experimental de balanceamento”.

Crie testes matemáticos.
Pare.
```

---

# ETAPA 38 — Calculadora de interações do mestre

## Prompt

```text
Implemente somente uma calculadora de interações para o host usando o MESMO Game Engine da partida.

Objetivo:
permitir que o mestre teste uma dúvida sem alterar o jogo real.

Exemplos:
- este ataque mata este alvo com esta defesa?
- como esta role aparece para este tipo de investigação?
- esta proteção impediria este ataque?

A ferramenta deve permitir montar um contexto simulado com:
- ator/role;
- ação;
- alvo/role;
- efeitos adicionais relevantes quando suportados.

Requisitos:
- nenhuma escrita na partida;
- nenhuma duplicação de regras dentro do componente;
- reutilizar resolvers/registry do Game Engine;
- mostrar reasonCodes traduzidos para explicação legível;
- indicar claramente “regra ainda não modelada” quando necessário.

Crie testes de integração calculator -> engine.
Pare.
```

---

# ETAPA 39 — PWA focada em uso presencial

## Prompt

```text
Transforme o projeto em PWA sem alterar regras ou fluxo do jogo.

Objetivo:
facilitar que jogadores e mestre deixem o Companion instalado no celular/tablet durante partidas presenciais.

Implemente:
- manifest;
- nome curto/completo;
- ícones referenciados corretamente;
- theme/background;
- standalone;
- metadata necessária;
- instalação quando suportada.

Offline completo NÃO é requisito porque a partida depende do Firebase Realtime Database.

Evite service worker agressivo que possa:
- cachear estado de partida antigo;
- mostrar role/timer obsoleto;
- prejudicar atualizações realtime.

Escolha biblioteca somente se compatível com a versão atual do Next.js.
Rode build e checks.
Pare.
```

---

# ETAPA 40 — Hardening das Firebase Security Rules

## Prompt

```text
Faça uma auditoria de segurança focada exclusivamente no Firebase Realtime Database considerando o novo modo presencial assistido.

Garanta pelo menos:
- usuário não autenticado não acessa dados sensíveis;
- jogador não se torna host;
- jogador não altera fase/timer;
- jogador não altera role;
- jogador não lê role de terceiros;
- jogador não lê roster privado do host;
- jogador não lê/escreve hostNightActions;
- jogador não lê hostNotes;
- jogador não lê preview/resolução host-only antes do que for permitido;
- jogador não escreve Event History administrativo;
- somente host aplica/rollbacka NightResolution;
- somente host usa overrides alive/dead/status;
- jogador pode ler somente seu próprio privatePlayer e dados públicos necessários.

Se paths antigos de votes/actions digitais ainda existirem para futuro modo automatizado:
- eles devem continuar seguros;
- não devem acidentalmente conceder acesso ao novo Action Log.

Crie testes de Security Rules com Firebase Emulator quando possível.
Inclua tentativas maliciosas explícitas.
Não altere UX.
Pare após os testes.
```

---

# ETAPA 41 — Validação, concorrência e resiliência

## Prompt

```text
Faça somente hardening da aplicação, sem adicionar feature nova.

Revise cenários de falha relevantes ao modo presencial:
- refresh do host durante a noite;
- refresh do jogador;
- conexão Firebase perdida e retomada;
- duas abas do host abertas;
- double click em criar ação;
- double click em confirmar resolução;
- preview desatualizado após editar Action Log;
- fase trocada enquanto o timer atualiza;
- NightSession inexistente;
- jogador removido enquanto está em selector;
- roleId inválido;
- targetUid inválido;
- ActionDefinition removida/alterada;
- partida encerrada;
- rollback após estado posterior incompatível.

Adicione:
- validações;
- loading/disabled states;
- idempotência;
- mensagens de erro úteis;
- prevenção de writes duplicados;
- testes para bugs encontrados.

Não redesenhe o produto.
Pare.
```

---

# ETAPA 42 — UX do painel do mestre para operação rápida

## Prompt

```text
Faça somente uma revisão de UX do DASHBOARD DO HOST pensando em alguém narrando uma partida presencial em tempo real.

O painel do mestre agora é a interface mais importante e mais complexa do produto.

Prioridades:
- fase/timer sempre visíveis;
- mini painel de fases acessível sem navegação profunda;
- Night Wake Checklist e Action Log próximos durante a noite;
- poucos cliques para registrar ação;
- selectors com nome + role;
- alvo fácil de encontrar;
- ações registradas legíveis como frases;
- preview/resultados com hierarquia visual clara;
- confirmação de ações destrutivas;
- erros e warnings visíveis sem bloquear indevidamente a condução;
- roster fácil de consultar;
- histórico antigo acessível, mas não ocupando espaço principal.

Teste pelo menos:
- desktop comum;
- notebook;
- tablet landscape;
- mobile como fallback.

Não altere mecânicas.
Corrija apenas problemas concretos.
Rode checks e pare.
```

---

# ETAPA 43 — UX mobile minimalista do jogador

## Prompt

```text
Faça somente uma revisão de UX mobile da interface do jogador.

A tela do jogador deve permanecer deliberadamente simples.

Prioridades:
- timer/fase imediatamente visível;
- nome da role em destaque;
- objetivo fácil de consultar;
- descrição beginner-friendly;
- detalhes/interações da role organizados sem poluição;
- nenhum controle de voto;
- nenhum formulário de ação;
- nenhum log do host;
- nenhuma informação de terceiros;
- nenhuma informação secreta aparecendo em title, notification, preview ou header indevido.

Teste pelo menos em:
- 320px;
- 375px;
- 430px.

Jogador morto continua podendo consultar role/timer.
Não alterar regras.
Rode checks e pare.
```

---

# ETAPA 44 — Acessibilidade básica

## Prompt

```text
Faça somente uma auditoria e correção de acessibilidade básica no Companion.

Revise host e jogador:
- labels;
- focus states;
- navegação por teclado;
- button vs div clicável;
- dialogs;
- aria quando necessário;
- contraste;
- mensagens de erro;
- disabled states;
- selectors de jogador/role;
- leitura do timer sem anunciar a cada segundo;
- estados pending/completed/skipped sem depender somente de cor;
- alive/dead sem depender somente de cor;
- warnings/resultados do engine compreensíveis.

Não alterar mecânicas.
Rode lint/checks e pare.
```

---

# ETAPA 45 — Testes E2E do fluxo presencial assistido

## Prompt

```text
Adicione/atualize testes end-to-end para cobrir o NOVO fluxo principal do Companion.

Se já houver Playwright ou solução equivalente, reutilize-a.

Cobrir ao menos:
1. host cria sala;
2. jogador entra;
3. host seleciona/sorteia roles;
4. jogador vê somente a própria role;
5. jogador não vê role de terceiros;
6. jogador não possui UI de votação/ação noturna;
7. host inicia uma fase predefinida;
8. jogador vê timer atualizado;
9. host escolhe fase diferente sem depender de transição rígida;
10. host inicia fase personalizada com duração escolhida;
11. host inicia NightSession;
12. Night Wake Checklist é gerado;
13. host registra ação de uma role;
14. host registra alvo;
15. Action Log persiste;
16. host edita ação;
17. host gera preview da resolução;
18. jogador não recebe dados secretos da resolução;
19. host confirma resolução;
20. alive/dead é atualizado quando aplicável;
21. host consulta histórico da noite.

Quando Firebase Emulator for necessário, nunca execute teste destrutivo no banco de produção.

Não use mocks que eliminem justamente a lógica principal que está sendo testada.
Rode a suíte e pare.
```

---

# ETAPA 46 — Primeiro playtest presencial assistido

## Prompt

```text
Prepare somente o projeto para o primeiro playtest real do novo fluxo presencial assistido.

Não adicione novas roles nesta etapa.

Crie ferramentas de diagnóstico simples para o host:
- versão/build visível discretamente;
- copiar gameId/código;
- exportar Action Log + NightResolution + Event History para JSON somente pelo host;
- códigos técnicos de erro copiáveis;
- checklist em docs/playtest-checklist.md.

O checklist deve pedir para testar presencialmente:
- entrada/reconexão;
- sigilo das roles;
- jogador usando somente role/timer;
- troca livre de fases;
- fase personalizada;
- timer;
- Night Wake Checklist;
- agrupamento de roles/facções que acordam juntas;
- criação rápida de ações;
- seleção automática do verbo da role;
- seleção de alvo;
- edição/correção do Action Log;
- preview da noite;
- explicação do resultado;
- aplicação de mortes/efeitos;
- rollback por erro;
- consulta de noites anteriores;
- uso do host em notebook/tablet;
- uso simultâneo de vários celulares.

Não adicionar analytics externo.
Pare.
```

---

# ETAPA 47 — Correções pós-playtest

## Prompt

```text
Analise somente os bugs e observações registrados no último playtest presencial assistido.

Não adicione funcionalidades novas.

Para cada bug:
1. reproduza;
2. identifique causa raiz;
3. crie teste quando aplicável;
4. implemente a menor correção coerente;
5. rode regressão relevante;
6. documente mudança de regra somente se realmente houver mudança de regra.

Prioridade:
1. vazamento de informação secreta;
2. resolução incorreta da noite;
3. perda/corrupção do Action Log;
4. aplicação duplicada de resolução;
5. erro de rollback;
6. fase/timer inconsistente;
7. Night Wake Checklist errado;
8. reconexão;
9. UX do host;
10. UX do jogador.

Ao final, produza resumo das correções e pare.
```

---

# ETAPA 48 — Configuração para Vercel

## Prompt

```text
Prepare somente o projeto para deploy de produção na Vercel.

Verifique:
- build de produção;
- variáveis NEXT_PUBLIC_FIREBASE_*;
- URLs absolutas do QR Code;
- metadata;
- manifest/PWA;
- redirects/rewrite se existirem;
- client/server components;
- ausência de segredos no Git;
- rotas diretas /game/[code] e /host/[code] ou equivalentes;
- Firebase authorized domains;
- comportamento de refresh do host durante uma NightSession.

Crie/atualize docs/deploy-vercel.md com:
- variáveis necessárias;
- comando de build;
- passos manuais;
- domínio;
- Firebase authorized domains;
- observações sobre PWA/cache.

Não alterar mecânicas.
Rode build e pare.
```

---

# ETAPA 49 — Auditoria final do MVP presencial assistido

## Prompt

```text
Faça uma auditoria final do MVP do Town of Salem Board Game Companion de acordo com a NOVA direção presencial assistida.

Não use automaticamente requisitos antigos que foram explicitamente abandonados, como envio de ação/voto pelo jogador.

Produza uma matriz:
- requisito;
- implementado;
- parcialmente implementado;
- não implementado;
- teste existente;
- risco.

Revise especialmente:
- segredo das roles;
- interface mínima do jogador;
- Firebase Rules;
- reconnect;
- realtime;
- seleção livre de fases;
- timer predefinido;
- timer personalizado;
- NightSession;
- Night Wake Checklist;
- Action Log estruturado;
- edição/correção do log;
- Game Engine;
- investigação e interações especiais;
- ataques/proteção/mortes;
- preview;
- explicação causal;
- aplicação idempotente;
- rollback;
- roster do mestre;
- condição de vitória assistida;
- Event History;
- histórico por noite;
- mobile jogador;
- desktop/tablet host;
- PWA;
- deploy.

Corrija somente bugs pequenos e evidentes durante a auditoria.
Registre itens maiores em docs/backlog.md.
Rode todos os checks disponíveis e pare.
```

---

# CHECKPOINT FINAL — Definição do MVP

O MVP presencial assistido está pronto quando:

## Jogador

- entra por código/QR;
- reconecta após refresh;
- vê somente a própria role;
- consulta descrição/interações;
- vê timer/fase;
- não precisa tocar no celular para executar ações do jogo.

## Mestre

- vê todos os jogadores/roles;
- seleciona qualquer fase a qualquer momento;
- usa duração predefinida ou personalizada;
- vê a ordem de quem acorda;
- conduz as perguntas presencialmente;
- registra cada ação no Action Log;
- seleciona ator/ação/alvo rapidamente;
- recebe preview estruturado da noite;
- entende o motivo do resultado;
- confirma mortes/efeitos;
- corrige erros;
- consulta noites anteriores;
- encerra a partida quando apropriado.

---

# Depois do MVP

Somente depois que o modo presencial assistido estiver estável, considerar prompts individuais para:

- novas roles;
- redirects/transport;
- imunidades especiais;
- interações investigativas adicionais;
- death notes;
- wills, se fizerem sentido na versão física;
- status temporários mais complexos;
- presets avançados;
- estatísticas;
- histórico de partidas persistente;
- exportação/impressão de resumo da partida;
- sons opcionais do painel do mestre;
- vibração/alerta quando timer termina;
- animações leves;
- internacionalização;
- modo espectador, somente se puder ser seguro;
- **Modo Automatizado opcional**;
- **votação digital opcional**;
- **ações noturnas enviadas pelo jogador opcionalmente**.

Esses três últimos itens NÃO devem contaminar o fluxo principal presencial.
Se forem criados futuramente, devem existir como outro modo/configuração explícita.

---

# Modelo de prompt para adicionar uma nova role ao modo presencial assistido

```text
Adicione SOMENTE a role [NOME DA ROLE] ao Town of Salem Board Game Companion.

Antes de programar:
1. leia RoleDefinition/ActionDefinition atuais;
2. leia o Night Wake generator;
3. leia o Host Action Log;
4. leia o Game Engine;
5. leia os testes existentes;
6. confirme que as regras fornecidas abaixo são suficientes.

Regras confirmadas da role:
[COLE AQUI AS REGRAS DA EDIÇÃO FÍSICA]

Implemente somente o necessário para esta role:
- catálogo;
- faction/alignment;
- objetivo;
- beginnerDescription;
- interações importantes para iniciantes;
- wakesAtNight;
- wakeOrder;
- wakeGroupId quando aplicável;
- ActionDefinition;
- actionVerb;
- targeting;
- quantidade de alvos;
- self target;
- alive/dead target;
- priority;
- efeitos no Game Engine;
- attack/defense quando aplicável;
- aparência/resultados investigativos;
- efeitos pós-morte quando aplicável;
- condição especial de vitória quando existir;
- resultado que deve ser mostrado ao HOST;
- testes unitários;
- testes de interação com roles já existentes.

Não implemente UI de envio da ação pelo jogador.
O mestre registra a ação no painel após perguntar presencialmente.

Não altere regras de outras roles sem necessidade.
Não invente comportamento não especificado.
Se houver ambiguidade, marque o ponto como unsupported/needs-verification e não simule certeza.

Rode testes e liste arquivos alterados.
Não implemente outra role.
```

---

# Modelo de prompt para corrigir uma interação do Game Engine

```text
Corrija SOMENTE esta interação do Game Engine:
[CENÁRIO]

Comportamento atual:
[ATUAL]

Comportamento correto:
[CORRETO]

Fonte/regra confirmada:
[REGRA]

Antes de alterar:
- localize a fonte de verdade da regra;
- verifique RoleDefinition/ActionDefinition;
- verifique investigativeAppearance quando relevante;
- verifique priority;
- verifique resolver genérico;
- verifique se o erro está apenas na apresentação do resultado ao host.

Depois:
1. crie teste reproduzindo o bug;
2. confirme que falha antes da correção;
3. faça a menor alteração correta;
4. confirme que passa;
5. rode regressão do Game Engine.

Não adicione exceção em componente React.
Não duplique regra.
Não altere outras interações sem necessidade.
```

---

# Estratégia de commits sugerida

Um commit por etapa ou por conjunto muito pequeno e inseparável.

Exemplos:

```text
refactor: switch player flow to assisted physical mode
refactor: allow free host phase selection
feat: add custom phase timer
feat: add night session tracking
feat: add host night wake checklist
feat: add structured host action log
feat: add smart night action composer
feat: add host action validation
feat: add night resolution engine
feat: add host night resolution preview
feat: add idempotent night resolution apply
feat: add night resolution rollback
feat: add host event history
fix: prevent player access to host night actions
```

---

# Regra de ouro desta nova fase

O site deve **ajudar o mestre a conduzir uma partida presencial**, não substituir a conversa da mesa.

A arquitetura desejada passa a ser:

```text
Sala / Lobby
      ↓
Sorteio seguro das roles
      ↓
Player: Role + Timer
      ↓
Host: Controle livre de fases
      ↓
NightSession
      ↓
Lista de quem acorda
      ↓
Mestre pergunta presencialmente
      ↓
Action Log estruturado
      ↓
Game Engine
      ↓
Preview explicável
      ↓
Confirmação do mestre
      ↓
Estado atualizado + histórico
```

O mestre continua tomando as decisões operacionais.
O engine funciona como **assistente de consistência e resolução**, não como narrador automático da partida.
