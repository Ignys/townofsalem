# Game engine

Framework-independent game rules belong here. Keep this layer free of React, Next.js, and Firebase dependencies, and prefer pure functions with explicit inputs and outputs.

`draw-roles.ts` performs role assignment with Fisher–Yates over copies of the participant and role arrays. It accepts an injectable random source for deterministic tests and does not persist or expose assignments by itself.

Card-game-specific relationships live in small rule modules. `combat.ts` resolves independent attacks, Doctor healing, Bodyguard interception/sacrifice, night immunity, Veteran visits and automatic Janitor cleaning. `visits.ts`, `investigation.ts`, `role-triggers.ts`, `day-effects.ts`, `role-resource-limits.ts`, and `win-condition.ts` keep those concerns independent from the orchestration in `resolve-night.ts`.

Random decisions use an injected or seeded source from `random.ts` and are returned with the resolution, so previews are reproducible and the selected result can be persisted. Optional rules are normalized in `variants.ts`; the default Bodyguard sacrifice cannot be healed.

`game-phase-machine.ts` is the single source of truth for structural `GamePhase` transitions. It exposes pure queries, keeps transition lists immutable, and leaves authorization, persistence, timers, and phase automation to later application layers.
