# Auditoria final do MVP presencial assistido

Legenda: **Sim** = implementado; **Parcial** = estrutura segura entregue, mas dados/regra oficial ou validação externa ainda pendem; **Não** = não implementado.

| Requisito | Estado | Evidência/teste | Risco residual |
| --- | --- | --- | --- |
| Segredo das roles | Sim | Rules Emulator e E2E com dois jogadores | Configuração incorreta de rules em produção |
| Interface mínima do jogador | Sim | E2E confirma role própria, timer e ausência de voto/ação | Playtest físico mobile pendente |
| Firebase Security Rules | Sim | Suíte do Emulator cobre leituras maliciosas, host-only e histórico append-only | Publicar as rules no projeto correto |
| Reconnect e realtime | Sim | Estado está no RTDB; E2E recarrega o host durante a noite | Rede móvel real ainda não ensaiada |
| Seleção livre de fases | Sim | Testes unitários e E2E fora de ordem rígida | Nenhum conhecido |
| Timer predefinido e personalizado | Sim | Testes unitários de sessão e E2E | Relógio depende do offset fornecido pelo Firebase |
| PhaseSession e NightSession estáveis | Sim | Testes de criação e E2E | Nenhum conhecido |
| Night Wake Checklist | Parcial | Gerador puro testado e checklist exercitado no E2E | Só Sheriff/Doctor têm metadados oficiais confirmados no catálogo inicial |
| Action Log estruturado, edição e correção | Sim | Validação unitária, E2E com refresh, editar e cancelar | Conflitos semânticos de duas edições simultâneas continuam last-write-wins, mas não corrompem revisionamento |
| Notas manuais fora do engine | Sim | CRUD host-only e separação estrutural | Conteúdo livre depende do host |
| Game Engine puro e determinístico | Sim | Testes unitários de adaptador, prioridade, efeitos e resolução | Cobertura mecânica limitada ao catálogo confirmado |
| Investigação e interações especiais | Parcial | Registry e calculadora retornam resultados ou reason codes testados | Mapeamentos oficiais pendentes |
| Mortes noturnas, proteção e roleblock | Sim | Pipeline binário e testes unitários para morte, imunidade e proteção | Interações especiais de Bodyguard e Veteran ainda exigem confirmação |
| Preview e explicação causal | Sim | Testes de apresentação e E2E | Warnings devem ser respeitados pelo host |
| Aplicação idempotente e concorrência | Sim | Claim transacional, revision guard e testes de estado | Interrupção extrema de rede pode exigir repetir a operação |
| Rollback administrativo | Sim | Snapshot dos campos tocados e E2E | Bloqueado de propósito após avanço incompatível de fase |
| Roster e overrides do mestre | Sim | UI realtime, alive/dead/cleaned com eventos | Override continua sendo decisão humana |
| Condição de vitória assistida | Parcial | Regras injetadas testadas; Game Over exige confirmação | Condições especiais neutras pendentes |
| Event History append-only | Sim | Rules Emulator, painel técnico e exportação JSON | Retenção/limite de histórico ainda não necessário no MVP |
| Histórico por noite | Sim | E2E e painel host-only | Nenhum conhecido |
| UX jogador mobile e host desktop/tablet | Sim | Viewports do E2E e controles com estados textuais | Validação presencial ainda pendente |
| Acessibilidade básica | Sim | Labels, foco nativo, estados não dependentes apenas de cor e timer sem live-region por segundo | Auditoria assistiva manual recomendada |
| PWA | Sim | Manifest, metadata e ícones; validado pelo build | Sem service worker agressivo/offline deliberadamente |
| Deploy Vercel | Parcial | Configuração, `.env.example`, metadata, rotas diretas e guia de deploy | Deploy/domínio autorizado exigem acesso externo do proprietário |

## Conclusão

As 49 etapas foram tratadas no escopo do MVP: implementação, testes, documentação ou preparação operacional conforme cada prompt. Os itens parciais não representam automações quebradas; são pontos em que o roadmap exige não inventar regras e registrar o que precisa de confirmação. O checklist presencial e o deploy efetivo permanecem ações externas documentadas.
