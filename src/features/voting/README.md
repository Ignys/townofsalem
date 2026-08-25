# Voting feature

Voting workflows and feature-specific presentation belong here. Reusable rule calculations belong in `src/game-engine`.

## Configuração atual

- Acusações usam maioria estrita dos jogadores vivos. O cálculo também oferece modos `two-thirds` e `fixed`; este default é uma decisão do aplicativo, não uma alegação sobre a regra oficial.
- O acusado não vota no próprio veredito.
- Abstenções são registradas, mas não entram na comparação entre culpado e inocente.
- Empates resultam em `tie` (sem decisão). A alternativa configurável é absolver.
- Encerrar um veredito apenas registra o resultado; nunca altera `alive` automaticamente.

Os defaults ficam em `voting-settings.ts`. A política de elegibilidade do Firebase deve permanecer sincronizada com essas opções.
