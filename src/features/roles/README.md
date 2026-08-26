# Roles feature

Public role presentation, host selection, composition validation, and feature-specific workflows belong here. Static definitions remain in `src/data/roles` and are the only source for role content.

The composition policy follows the number of copies in the physical deck. Repeated role IDs are allowed up to each role's `cardCount`, and the Firebase record stores those counts under `settings/roleComposition`.

`balance-score.ts` calculates the official Virtue Value sum: positive totals favor Town, negative totals favor evil roles, and zero is the target. `balanced-composition-generator.ts` finds the closest-to-zero composition for the faction counts selected by the host while respecting physical card limits and any required roles. The automatic and semiautomatic flows support 4 to 36 players, derive their preferred Town/Mafia/Neutral ratio in `suggested-faction-counts.ts`, and fit that ratio to required roles and physical faction capacities in `composition-faction-constraints.ts`; curated 10, 12, and 15-player compositions remain in `role-presets.ts`.

Role assignment re-reads and validates the current Firebase state, uses the pure Game Engine draw, and writes every `privatePlayers/{uid}` record together with the assignment marker and public status transition in one atomic multipath update.

The complete `privatePlayers` subscription is mounted only by the post-draw host panel after the restored Firebase UID has been verified against the game's real `hostUid`. Player-facing code continues to use only its exact `privatePlayers/{auth.uid}` observer.
