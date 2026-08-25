# Resultados do playtest automatizado

O fluxo presencial assistido foi exercitado de ponta a ponta com Playwright, Firebase Auth Emulator e Realtime Database Emulator. O teste usa um host e dois jogadores reais do emulador, sem tocar no banco de produção.

## Problemas encontrados e corrigidos

| Sintoma | Causa raiz | Correção | Regressão |
| --- | --- | --- | --- |
| Falha ao salvar uma ação e concluir o item do checklist na mesma operação | O update continha simultaneamente um caminho ancestral e um descendente da mesma `NightSession` | O incremento de `actionsRevision` foi separado em transação e protegido por marcadores de escrita pendente | Fluxo E2E e testes unitários do estado de resolução |
| Histórico quebrava após uma resolução sem mortes | O Realtime Database remove arrays vazios, tornando campos opcionais na leitura | A apresentação normaliza coleções ausentes para arrays/mapas vazios | Fluxo E2E de preview, aplicação e histórico |
| Rules Emulator rejeitava a expressão de validação de texto | A expressão regular usada não era compatível com a sintaxe aceita pelo emulador | Validação foi reescrita com expressão compatível, preservando a exigência de conteúdo não vazio | Testes do Firebase Emulator |
| Uma resolução poderia concorrer com uma Action Log write ainda sem revision incrementada | A persistência da ação e a atualização da revisão são operações distintas | Cada escrita recebe um marcador transacional único; o claim da resolução recusa qualquer sessão com escrita pendente | Testes do estado de resolução e E2E do Action Log |
| Duas abas poderiam confirmar simultaneamente a mesma identidade de resolução | O lock usava o ID compartilhado do preview, não uma identidade exclusiva da tentativa | Claim transacional usa token exclusivo com lease de recuperação; repetições posteriores continuam idempotentes | Teste unitário do lease e E2E de confirmar/rollback |
| Painel do host criava rolagem horizontal em 430 px | Uma trilha implícita de CSS Grid respeitava a largura mínima do conteúdo em vez de encolher | Trilhas explícitas `minmax(0, 1fr)` e contenção do limite visual da página | E2E em quatro viewports do host e três do jogador |

## Resultado

O cenário automatizado cobre criação e entrada na sala, sigilo de roles, sorteio, troca livre de fases, timer predefinido e personalizado, criação da noite, checklist, Action Log com edição/cancelamento, persistência após refresh, preview, confirmação, rollback e consulta do histórico.

O playtest físico com vários aparelhos, redes móveis reais e mediação humana continua sendo uma atividade manual. Use `docs/playtest-checklist.md` para registrá-lo; este arquivo não finge que o ensaio automatizado substitui essa validação presencial.
