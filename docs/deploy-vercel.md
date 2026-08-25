# Deploy na Vercel

## Build

Use Node.js compatível com o Next.js declarado no projeto e execute `npm ci` seguido de `npm run build`. O diretório de saída é gerenciado pelo adaptador padrão do Next.js na Vercel.

## Variáveis obrigatórias

Configure em Preview e Production:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Esses valores identificam o Firebase Web SDK; a autorização real depende das Security Rules. Não inclua credenciais administrativas ou service-account no cliente.

## Domínio e rotas

- Defina o domínio final no projeto Vercel.
- Adicione o domínio Vercel e o domínio próprio em Firebase Authentication → Authorized domains.
- Confirme acesso direto e refresh em `/game/{CODE}` e `/host/{CODE}`.
- O QR Code usa `window.location.origin`, portanto recebe automaticamente a origem absoluta do deploy.

## PWA e cache

O manifest usa modo standalone e o favicon existente. Não há service worker agressivo: role e timer dependem de dados realtime e não devem ser servidos de cache obsoleto. Após mudanças de domínio ou ícone, remova a instalação antiga do aparelho antes de validar novamente.

## Verificação final

- Build de produção passa sem segredos no repositório.
- Host recarrega durante uma NightSession e recupera checklist/log.
- Jogador recarrega e continua vendo apenas a própria role.
- Firebase Rules publicadas correspondem a `database.rules.json`.
