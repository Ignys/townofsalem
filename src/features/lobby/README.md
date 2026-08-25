# Lobby feature

Room creation, entry, host restoration, and the shared realtime lobby live here. Firebase listeners remain behind repositories and hooks; visual components receive only public game and player records.

The shared lobby view remains limited to connected public players and connection state. Host-only role selection and assignment live in `src/features/roles`; the player route switches to its exact private role record only after assignment.
