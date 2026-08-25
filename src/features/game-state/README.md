# Game state feature

Application-level game-state orchestration belongs here. Framework-independent rules stay in `src/game-engine`.

The player role screen subscribes only to `privatePlayers/{auth.uid}`. It resolves the stored role ID through the local catalog and never reads or lists another player's private record.

Phase control uses the pure Game Engine state machine, revalidates the latest public game, and persists only allowed transitions. `transitionGamePhase` returns a `PHASE_CHANGED` event draft as the integration hook for the future event-history stage; it does not create a partial history subsystem here.
