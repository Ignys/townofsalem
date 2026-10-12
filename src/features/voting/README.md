# Voting feature

Voting workflows and feature-specific presentation belong here. Reusable rule calculations belong in `src/game-engine`.

## Configuração atual

- Acusações usam maioria estrita dos jogadores vivos. O cálculo também oferece modos `two-thirds` e `fixed`; este default é uma decisão do aplicativo, não uma alegação sobre a regra oficial.
- O acusado não vota no próprio veredito.
- Abstenções são registradas, mas não entram na comparação entre culpado e inocente.
- Empates resultam em `tie` (sem decisão). A alternativa configurável é absolver.
- Encerrar um veredito apenas registra o resultado; nunca altera `alive` automaticamente.

Os defaults ficam em `voting-settings.ts`. A política de elegibilidade do Firebase deve permanecer sincronizada com essas opções.

## Votação digital (modo presencial assistido)

Os jogadores votam pelo próprio celular. A acusação é pública e ao vivo; o veredito é
secreto até o mestre encerrar, para que ninguém espelhe o voto de quem falou primeiro
na mesa.

- Fases de acusação: `day` e `discussion` (`voting-phases.ts`). O mestre transita livremente
  entre elas, então gatear só em `discussion` deixaria de fora quem nunca sai de `day`.
- Ao atingir a maioria estrita, `use-auto-accused-trial.ts` leva ao julgamento sozinho, com
  3s de carência e um "Cancelar" puramente local — só o mestre sabe se a contagem foi engano.
- `startAccusedTrial` entra em `trial` **sem timer**: o jogo para até o mestre interromper a
  conversa presencial e iniciar a fase Defesa (30s).
- Empate no limiar não dispara nada: dois jogadores não podem ser "o" acusado.

### Blackmail não é barrado nas regras do RTDB

A exclusão do jogador silenciado depende da variante `blackmailedCannotVote` e de dados
privados. Negar a escrita na regra vazaria "você está blackmailed" através de um erro
distinguível. Por isso o voto é **aceito** e descartado no host por `getEligibleVoterUids`;
a UI do jogador apenas avisa e desabilita os botões.

### Veredito culpado

O linchamento é aplicado por `applyDayResolution` (painel "Resolução do dia", já preenchido e
travado no condenado), e não por um caminho próprio: só ele grava a lápide no `graveyard` e
trata a decisão do Executioner e a vingança do Jester.
