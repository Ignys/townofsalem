# Town of Salem Companion

**Um companion web para jogar Town of Salem Card Game presencialmente — com mestre ou com uma mesa automatizada.**

O projeto conecta os participantes por meio de celulares e usa uma tela compartilhada para organizar a partida. Ele reúne sorteio de roles, fases, ações noturnas, acusações, julgamentos, temporizadores e resultados, sem exigir que cada pessoa tenha o jogo digital original.

> **Projeto independente e não oficial.** Inspirado no *Town of Salem Card Game*. Não é afiliado aos criadores ou detentores dos direitos de Town of Salem. As regras e variantes utilizadas pelo aplicativo devem ser conferidas com a edição física adotada pelo grupo.

## Como funciona

O moderador cria uma sala no navegador e compartilha o código ou link. Os jogadores entram com um nickname, recebem uma role privada após o sorteio e acompanham a partida em seus dispositivos.

A sala possui **dois modos**, selecionados antes do início:

| | Com mestre | Sem mestre |
| --- | --- | --- |
| **Condução** | Uma pessoa conduz a partida usando o painel administrativo. | A tela da mesa executa a sequência de fases automaticamente. |
| **Ações noturnas** | O mestre acompanha, registra, corrige e resolve as interações, com apoio das ações enviadas pelos jogadores. | Os jogadores escolhem seus alvos pelo celular; a mesa processa os resultados. |
| **Dia e votação** | O mestre controla as fases, acompanha os votos e confirma os resultados quando necessário. | Acusações, defesa, veredito e transições seguem o fluxo automatizado. |
| **Tela compartilhada** | Painel com informações e ferramentas administrativas. | Exibe apenas informações públicas, sem revelar as roles secretas. |
| **Ideal para** | Grupos que preferem um narrador e mais controle sobre situações especiais. | Grupos em que todos querem participar como jogadores. |

**Importante:** no modo sem mestre, o motor automático roda na página da mesa (rota `/host/[code]`). **Mantenha essa aba aberta, conectada e com o dispositivo ativo durante a partida.** O Firebase sincroniza os dados, mas não executa sozinho o avanço das fases em segundo plano.

## Funcionalidades

### Salas e jogadores

- Criação de salas nomeadas, com códigos de 6 caracteres e link compartilhável.
- Lista de salas abertas, com quantidade de participantes e estado da partida.
- Lobby sincronizado em tempo real, com assentos e status dos jogadores.
- Autenticação anônima pelo Firebase, sem cadastro tradicional.
- Recuperação da sessão ao recarregar a página; reentrada em partidas em andamento com o mesmo nickname por meio do endpoint de recuperação, quando configurado.
- Inclusão de jogadores simulados no roster pelo moderador (**não** são bots com inteligência própria ou decisões autônomas).

### Roles e composição

- Catálogo das **25 roles e 39 cartas** da edição física documentada no projeto, divididas entre **Town**, **Mafia** e **Neutral**.
- Enciclopédia pública de roles em `/roles`, com descrição, objetivos, dicas e interações.
- Sorteio de roles com visualização privada de cada jogador.
- Montagem manual, geração automática e composição semiautomática.
- Slots de role aleatória e regras configuráveis de repetição conforme as cartas disponíveis.
- Estimativa de equilíbrio da composição usando **Virtue Value**.
- Presets personalizados de composição, que podem ser salvos e reutilizados.
- Geração automática de composições para **4 a 36 jogadores**, sujeita às restrições de roles e cartas configuradas.

### Durante a partida

- Fases e temporizadores sincronizados, com opções de pausa e ajuste.
- Ações noturnas e seleção de alvos pelos celulares, respeitando permissões e limitações das roles.
- Painel de coordenação da Mafia, com informações da equipe e escolhas de alvo.
- Acusações e vereditos digitais, incluindo contagem e apresentação de resultados.
- Resolução de ataques, proteções, bloqueios, investigações e outros efeitos previstos no motor.
- Resultados privados das ações e revelações públicas de mortes e do cemitério.
- Histórico de eventos, registro das ações noturnas e ferramentas administrativas de correção.
- Verificação de condições de vitória e apresentação do encerramento da partida.
- Configurações opcionais para adaptar determinadas interações e regras especiais.

Nem todas as interações especiais são universais entre versões de Town of Salem. O motor separa regras implementadas de casos que ainda precisam de validação com a edição física; consulte o [backlog](./docs/backlog.md).

## Ritmos do modo sem mestre

O modo automático oferece três opções:

| Ritmo | Noite | Discussão | Defesa | Veredito |
| --- | ---: | ---: | ---: | ---: |
| **Relaxed** | 1min30s | 5min | 30s | 30s |
| **Normal** | 1min | 3min | 30s | 30s |
| **Fast track** | Até 1min | 3min | 30s | Até 30s |

No **Fast track**, a noite pode terminar assim que todos os participantes habilitados concluírem suas ações, e o veredito pode ser encerrado assim que todos os eleitores elegíveis votarem.

O fluxo automático inclui uma etapa de **preparação ao amanhecer** para que os participantes leiam o resultado da noite antes de começar a discussão. A mesa pode pular essa etapa quando necessário.

## Começando uma partida

1. Abra o aplicativo e escolha **Criar sala**.
2. Dê um nome à sala e compartilhe o código ou o link com os demais participantes.
3. Peça que cada jogador entre pelo próprio celular com um nickname.
4. No painel da sala, escolha **Com mestre** ou **Sem mestre**. No segundo caso, defina também o ritmo.
5. Monte a composição de roles manualmente, gere uma composição automática ou use um preset.
6. Selecione **Sortear roles e começar**.
7. Cada jogador consulta sua role em particular e acompanha as ações disponíveis conforme as fases avançam.

No modo com mestre, uma pessoa deve permanecer no painel de controle. No modo sem mestre, a tela da sala pode ser deixada em um computador ou tablet compartilhado enquanto todos jogam pelos celulares.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicação | **Next.js 16**, **React 19**, **TypeScript** |
| Interface | **Tailwind CSS 4**, **Lucide React**, **Framer Motion**, **DnD Kit** |
| Autenticação | **Firebase Authentication** (login anônimo) |
| Dados em tempo real | **Firebase Realtime Database** |
| Operações administrativas no servidor | **Firebase Admin SDK** |
| Testes | **Node.js/tsx**, **Playwright**, **Firebase Emulator Suite** |
| Deploy | **Vercel** (configuração documentada) |

O motor das regras é implementado em TypeScript e separado das dependências do Next.js, React e Firebase, permitindo testar suas decisões por funções puras.

## Executando localmente

### Pré-requisitos

- Node.js compatível com Next.js 16 (20.9 ou superior) e npm.
- Um projeto no Firebase.
- **Authentication → Sign-in method → Anonymous** habilitado.
- Uma instância do **Realtime Database** criada.
- Regras do Realtime Database publicadas no projeto correto.

### 1. Instale as dependências

```bash
git clone https://github.com/Ignys/townofsalem.git
cd townofsalem
npm ci
```

### 2. Configure o ambiente

Copie `.env.example` para `.env.local` e preencha as configurações do seu aplicativo Web do Firebase:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

A lista completa, incluindo integrações opcionais e variáveis dos emuladores, está em [`.env.example`](./.env.example).

**Configurações de servidor:**

| Variável | Uso |
| --- | --- |
| `SYNC_SERVICE_ACCOUNT` | JSON da service account do Firebase (em texto ou base64). Necessária para os endpoints administrativos, incluindo a recuperação de um jogador que perdeu a sessão. |
| `SYNC_KEY` | Chave opcional de acesso ao endpoint `/api/sync`. |
| `SYNC_PATHS` | Mapa JSON opcional de caminhos extras retornados pelo endpoint de sincronização. |

As variáveis com prefixo `NEXT_PUBLIC_` são disponibilizadas ao navegador. **Nunca** exponha a service account, `SYNC_KEY` ou outras credenciais privadas nesse prefixo, e não faça commit do `.env.local`. O acesso aos dados é controlado principalmente pelas **Firebase Security Rules**, não pelo sigilo da configuração pública do SDK.

### 3. Publique as regras do banco

As regras versionadas estão em [`database.rules.json`](./database.rules.json). Para publicá-las, configure a Firebase CLI e execute:

```bash
npx firebase-tools login
npx firebase-tools deploy --only database --project SEU_FIREBASE_PROJECT_ID
```

> A publicação substitui as regras existentes do Realtime Database **no projeto selecionado**. Confira o ID antes de executar, especialmente em um ambiente que já tenha dados de produção.

Veja também [`docs/firebase-rules.md`](./docs/firebase-rules.md) e [`docs/firebase-schema.md`](./docs/firebase-schema.md).

### 4. Inicie a aplicação

```bash
npm run dev
```

Abra **http://localhost:3000**.

## Comandos disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera o build de produção. |
| `npm run start` | Executa o build de produção. |
| `npm run lint` | Executa o ESLint. |
| `npm test` | Executa os testes unitários em `src/**/*.test.ts`. |
| `npm run test:e2e` | Executa os testes de ponta a ponta com Playwright. |
| `npm run test:rules` | Executa testes das regras usando os emuladores de Authentication e Realtime Database. |
| `npm run test:rules:unit` | Executa diretamente o arquivo dos testes de regras (requer emuladores disponíveis). |

Para executar os testes E2E pela primeira vez, pode ser necessário instalar o navegador de testes com `npx playwright install`. A suíte de regras requer os emuladores e os pré-requisitos da Firebase CLI.

## Estrutura do projeto

```text
src/
├── app/                  # Páginas, layouts e endpoints de API do Next.js
│   ├── game/[code]/      # Experiência do jogador
│   ├── host/[code]/      # Painel do moderador / tela da mesa
│   ├── roles/            # Enciclopédia de roles
│   └── api/              # Recuperação de sessão e sincronização
├── components/           # Componentes compartilhados
├── data/roles/           # Catálogo estático de roles
├── features/             # Funcionalidades por domínio
│   ├── auth/             # Autenticação
│   ├── lobby/            # Salas, entrada e preparação
│   ├── roles/            # Composição, sorteio e apresentação
│   ├── game-state/       # Fases, mesa e automação
│   ├── night-actions/    # Ações e resolução noturna
│   ├── voting/           # Acusação, julgamento e veredito
│   ├── mafia/            # Coordenação da Mafia
│   ├── timer/            # Temporizadores sincronizados
│   └── game-variants/    # Regras opcionais
├── game-engine/          # Regras de jogo independentes da interface
├── lib/firebase/         # SDK, repositórios, caminhos e schema
└── types/                # Tipos do domínio

tests/e2e/                # Testes de fluxos completos
tests/                    # Testes das regras do Firebase
docs/                     # Documentação e registros técnicos
database.rules.json       # Regras do Realtime Database
```

### Separação de responsabilidades

- **`src/game-engine`:** calcula efeitos, ações, sorteios, resultados e condições de vitória sem depender da interface.
- **`src/features`:** implementa fluxos do lobby, jogadores, mestre e mesa automática.
- **`src/lib/firebase`:** concentra integração, observadores e persistência no Realtime Database.
- **`database.rules.json`:** restringe leituras e escritas conforme a identidade autenticada e o contexto da partida.

As roles dos jogadores ficam em registros privados, separados do roster público. Essa separação depende de regras corretamente configuradas no Firebase para ser efetiva.

## Publicação

A aplicação utiliza o fluxo padrão de deploy do Next.js na Vercel:

1. Importe o repositório na Vercel.
2. Configure as variáveis `NEXT_PUBLIC_FIREBASE_*` para o ambiente de produção.
3. Configure `SYNC_SERVICE_ACCOUNT` no **servidor** para habilitar a recuperação de sessões e os endpoints que dependem do Admin SDK. Configure `SYNC_KEY` apenas se utilizar o recurso de sincronização.
4. Adicione o domínio da Vercel ou o domínio próprio em **Firebase Authentication → Authorized domains**.
5. Publique as regras do Realtime Database no projeto Firebase correspondente.
6. Teste acesso e atualização direta das rotas `/host/[code]` e `/game/[code]`.

Consulte o [guia de deploy](./docs/deploy-vercel.md) para detalhes. O projeto possui manifesto de PWA, mas **não oferece funcionamento offline completo**: as partidas dependem de sincronização em tempo real.

## Estado do projeto e limitações

O aplicativo está **em desenvolvimento**. Existem testes unitários, testes E2E e testes das regras do Firebase no repositório, mas isso não substitui a validação de uma partida real com vários dispositivos.

Pontos importantes:

- O avanço automático do modo sem mestre depende do dispositivo que mantém a tela da mesa aberta; não há um serviço independente de automação contínua no servidor.
- Jogadores simulados ajudam a compor o roster, mas não tomam decisões como participantes humanos.
- Algumas interações especiais e variantes devem ser conferidas contra o [rulebook físico](./Town%20of%20Salem%20Card%20Game%20%E2%80%94%20Rulebook.md).
- A experiência exige conexão com o Firebase; a instalação como PWA não transforma o jogo em um aplicativo offline.
- A escolha de regras opcionais pode alterar resultados em relação a outras versões do jogo.

### Documentação complementar

- [Rulebook do jogo de cartas](./Town%20of%20Salem%20Card%20Game%20%E2%80%94%20Rulebook.md)
- [Modelo de dados do Firebase](./docs/firebase-schema.md)
- [Regras de segurança do Firebase](./docs/firebase-rules.md)
- [Checklist de playtest](./docs/playtest-checklist.md)
- [Backlog e pontos pendentes](./docs/backlog.md)
- [Guia de deploy na Vercel](./docs/deploy-vercel.md)

---

Desenvolvido como ferramenta de apoio para partidas presenciais de **Town of Salem Card Game**.