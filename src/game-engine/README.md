# Game engine

Framework-independent game rules belong here. Keep this layer free of React, Next.js, and Firebase dependencies, and prefer pure functions with explicit inputs and outputs.

`draw-roles.ts` performs role assignment with Fisher–Yates over copies of the participant and role arrays. It accepts an injectable random source for deterministic tests and does not persist or expose assignments by itself.

Card-game-specific confirmed relationships live in small rule modules. `role-rules.ts` covers forced verdicts, revealed Mayor vote weight, Deputy activation, action schedules, table adjacency, and Godfather tie breaking. Night deaths are binary: an unprotected kill eliminates a role only when `canDieAtNight` is true; protection effects prevent that death without attack or defense levels.

`game-phase-machine.ts` is the single source of truth for structural `GamePhase` transitions. It exposes pure queries, keeps transition lists immutable, and leaves authorization, persistence, timers, and phase automation to later application layers.
