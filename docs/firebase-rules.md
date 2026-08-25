# Firebase Realtime Database Security Rules

The first ruleset is deny-by-default and follows the data boundaries documented in `firebase-schema.md`.

## Current restrictions

- Unauthenticated clients cannot read or write game data.
- Authenticated clients can read only an exact `roomCodes/{CODE}` entry; listing the complete index is denied.
- An authenticated client can reserve an unused six-character room code for its own UID. Only that UID can finalize the reservation as the stable `gameId` mapping or release it.
- A new game must identify the authenticated creator as `hostUid` and be created in the same multipath update that finalizes its reserved room code. `hostUid` is immutable afterward.
- Any authenticated client can read the narrow `public` branch needed to validate a room-code lookup. Settings, the roster, and the complete `games/{gameId}` node remain restricted to members and the host.
- A player can create their own public record during the lobby with `alive: true`. They can update their name and experience only while the game remains in the lobby, and can update their own `disconnected` state later. Only the host can change `alive` or `seat` after creation.
- New player records require both public status and phase to be `lobby`; nickname and experience are validated at the data boundary, and clients cannot write roles through the public player path.
- A player can read their own exact public record even after it is removed. This narrow permission lets the reconnection listener receive a missing record without opening the complete roster.
- Private player records are readable only by their owner or the host. Only the host can write them.
- A night action is readable by its author and the host and writable only by its author.
- Accusations and verdicts are writable only at the authenticated player's UID and only while that public player is alive.
- Phase, status, timer, settings, public events, and administrative player fields are host-controlled.
- The role composition accepts only catalog IDs, currently limits each role to one copy, and can be changed only by the host while status and phase are both `lobby`.
- Private role records accept only catalog role/faction pairs, can be created only once by the host for existing players, and only while the game is still in the lobby. The application writes all assignments, the one-time marker, and the status transition atomically.
- Reading the complete `privatePlayers` collection is reserved for the authenticated game host. Player screens subscribe only to their own UID child; other private-player children remain denied.
- Game status transitions are monotonic: creation starts in `lobby`, assignment advances to `in-progress`, and completion may advance to `finished`. Returning to a previous status is rejected.
- Phase writes mirror the centralized state-machine edges, reject skips and reverse transitions, and require an in-progress game. Moving to `game-over` also finishes the game through the application-level atomic update.
- Timer fields are public for synchronized display but remain host-writable. Countdown ticks are calculated locally; Firebase stores only absolute end time or paused remaining duration.

Public event visibility is also denied to players for now. Event payload sanitization does not exist yet, so only the host can read or write the event branch.

## Deploy

Install or invoke the Firebase CLI, authenticate, and deploy only the Realtime Database rules:

```bash
firebase login
firebase deploy --only database --project <FIREBASE_PROJECT_ID>
```

No project ID is committed in `.firebaserc`. Pass the intended Firebase project explicitly with `--project`, or create a local alias with `firebase use --add` before deploying.

Deploying from the CLI replaces the Realtime Database rules currently configured in the Firebase console. Review the target project and diff before confirming a production deployment.
