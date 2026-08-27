# Town of Salem Companion

Companion web para partidas presenciais de **Town of Salem Card Game**. O projeto foi pensado para auxiliar o mestre e os jogadores sem substituir a dinâmica presencial: o mestre continua conduzindo a partida e chamando as roles, enquanto o sistema organiza informações, tempo, fases e estado da sala.

> Este é um projeto independente e não oficial. Town of Salem pertence aos seus respectivos detentores de direitos.

## Objetivo

O Companion reduz a carga operacional de quem está narrando uma partida física. Os jogadores entram em uma sala pelo navegador e recebem apenas as informações necessárias para acompanhar o jogo, enquanto o mestre dispõe de controles administrativos e ferramentas de organização.

## Funcionalidades

- Criação e entrada em salas por código.
- Lobby de jogadores antes do início da partida.
- Distribuição e visualização privada de roles.
- Painel dedicado para o mestre da partida.
- Controle manual das fases do jogo.
- Temporizadores por fase e duração personalizada.
- Controle de jogadores vivos, desconectados e assentos.
- Suporte a jogadores simulados/bots no roster do mestre.
- Registro e resolução estruturada de ações noturnas.
- Notas e informações administrativas exclusivas do mestre.
- Persistência e sincronização em tempo real com Firebase.
- Regras de acesso separando informações públicas, privadas e administrativas.

## Filosofia do projeto

O sistema é um **companion para o jogo presencial**, não uma implementação digital completa de Town of Salem. A interface não deve substituir interações como o mestre anunciar uma role e perguntar presencialmente quem será o alvo. O site serve principalmente para revelar informações privadas, controlar o tempo e ajudar o mestre a registrar e resolver o que aconteceu na partida.

## Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Firebase](https://firebase.google.com/) 12 — Authentication e Realtime Database
- [Lucide React](https://lucide.dev/) — ícones
- Node.js / npm
- Playwright — testes E2E

## Requisitos

- Node.js compatível com Next.js 16
- npm
- Projeto Firebase configurado
- Anonymous Authentication habilitado no Firebase
- Realtime Database criado e configurado

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/Ignys/townofsalem.git
cd townofsalem
npm install
```

Crie um arquivo `.env.local` na raiz do projeto usando `.env.example` como referência e preencha as credenciais públicas do seu projeto Firebase.

Depois execute:

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Variáveis de ambiente

O cliente Firebase utiliza as variáveis públicas `NEXT_PUBLIC_FIREBASE_*`. Consulte o arquivo `.env.example` do repositório para a lista atual de variáveis exigidas pelo projeto.

Não faça commit de `.env.local` ou de credenciais privadas.

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm run start     # inicia o build de produção
npm run lint      # ESLint
npm run test      # testes unitários
npm run test:e2e  # testes E2E com Playwright
```

## Firebase

A aplicação utiliza autenticação anônima para identificar sessões e o Firebase Realtime Database para sincronizar as salas. As regras do banco são parte importante da segurança: dados públicos, dados privados de jogadores e dados exclusivos do host possuem permissões diferentes.

A documentação do modelo está em `docs/firebase-schema.md`. O repositório também contém as regras e índices usados pelo Realtime Database.

## Estrutura geral

```text
src/
├── app/          # rotas e páginas do Next.js
├── components/   # componentes reutilizáveis
├── features/     # funcionalidades e domínios do jogo
├── lib/          # integrações e utilitários
└── test/         # suporte aos testes

docs/             # documentação técnica e decisões
public/           # assets estáticos
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as mesmas variáveis `NEXT_PUBLIC_FIREBASE_*` do `.env.local`.
3. Mantenha o framework detectado como Next.js.
4. Faça o deploy.

O lockfile deve permanecer versionado para que o ambiente de produção instale exatamente a árvore de dependências esperada.

## Desenvolvimento

Antes de enviar alterações, rode pelo menos:

```bash
npm run lint
npm run test
npm run build
```

Para alterações que afetem os fluxos principais da interface, execute também:

```bash
npm run test:e2e
```

## Status

O projeto está em desenvolvimento ativo. Algumas interações especiais dependem de confirmação das regras da edição física adotada e são mantidas explícitas na documentação em vez de serem inferidas pelo sistema.
