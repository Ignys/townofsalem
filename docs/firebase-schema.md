# Firebase Realtime Database schema

This document defines the logical database shape. It does not create data, database operations, or Security Rules.

## Tree

```text
roomCodes/
  {CODE}: gameId

  # During creation only, before the final atomic update:
  {CODE}/
    gameId
    reservedByUid

games/
  {gameId}/
    hostUid
    public/
      code
      status
      phase
      day
      phaseEndsAt
      timerPaused
      timerRemainingMs
      phaseLabel
      phaseSessionId
      currentNightId
      phaseSequenceNumber
      nightNumber
    settings/
      maxPlayers
      preset
      roleComposition/
        {roleId}: count
      rolesAssignedAt
    players/
      {uid}/
        name
        alive
        disconnected
        experience
        seat
    privatePlayers/
      {uid}/
        roleId
        faction
        statuses/
          {statusId}/
            type
    phaseSessions/
      {phaseSessionId}/
        id
        phaseId
        label
        startedAt
        durationSeconds
        endsAt
        sequenceNumber
        nightId
    nightSessions/
      {nightId}/
        id
        phaseSessionId
        nightNumber
        startedAt
        endedAt
        resolutionId
        resolutionAppliedAt
        rolledBackAt
        actionsRevision
        resolutionApplyingId
        resolutionApplyingAt
        pendingActionWrites/
          {writeId}: true
        wakeChecklist/
          {wakeItemId}/
            itemId
            status
            updatedAt
    hostNightActions/
      {nightId}/
        {actionEntryId}/
          id
          nightId
          actorUid
          roleIdSnapshot
          actionId
          targetUids
          createdAt
          updatedAt
          status
          optionalNotes
    hostNotes/
      {nightId}/{noteId}/...
    nightResolutions/
      {nightId}/...
    nightResolutionVersions/
      {nightId}/
        {resolutionId}/...
    actions/
      {nightNumber}/
        {uid}/
          actionType
          targetUid
          createdAt
    votes/
      {dayNumber}/
        accusations/
          {uid}: targetUid
        verdicts/
          {uid}: guilty | innocent | abstain
    events/
      {eventId}/
        type
        timestamp
        payload
```

Branches with no children do not need to exist. Realtime Database removes empty objects, so collection properties are optional in the TypeScript record.

## Security boundaries

`players` contains only public player data. Roles, factions, and effect statuses are stored separately under `privatePlayers`. A client must never be granted read access at `games/{gameId}` because Realtime Database permissions cascade to every descendant. Access should be granted only at the narrow child paths needed by that client.

The intended future access model is:

| Path | Intended access |
| --- | --- |
| `roomCodes/{CODE}` | Exact-code lookup for joining; do not allow listing `roomCodes` |
| `games/{gameId}/public` | Readable by authenticated clients so a code holder can validate admission; writable by the host |
| `games/{gameId}/settings` | Non-secret settings readable by members; writable by the host |
| `games/{gameId}/players/{uid}` | Public roster data; player-owned fields validated against `auth.uid`, administrative fields controlled by the host |
| `games/{gameId}/privatePlayers/{uid}` | Readable only by that UID and the host; role assignment writable only by the host or trusted backend |
| `games/{gameId}/phaseSessions` | Host-only historical phase activations |
| `games/{gameId}/nightSessions` | Host-only stable night identities |
| `games/{gameId}/hostNightActions/{nightId}` | Host-only editable operational Action Log |
| `games/{gameId}/hostNotes/{nightId}` | Host-only notes, excluded from the engine |
| `games/{gameId}/nightResolutions/{nightId}` | Host-only previews/applied resolutions |
| `games/{gameId}/nightResolutionVersions/{nightId}` | Host-only immutable identities for applied and rolled-back resolution attempts |
| `games/{gameId}/actions` and `votes` | Inactive legacy automated-mode branches, host-only in the principal mode |
| `games/{gameId}/events` | Host-only, append-oriented audit history; public events require a separately sanitized branch |

## Design decisions

- Player, action, and vote records use the authenticated Firebase UID as their key. This avoids duplicating identity fields and supports direct comparisons between path wildcards and `auth.uid` in Security Rules.
- `hostUid` remains outside `public`. Rules can consult it without exposing it through the public game-state read.
- The host is not inserted into `players` when a game is created. The host is a separate moderator identity, and creation does not yet collect the name and experience required for a valid public player record. A future explicit player-join flow may add the same UID to `players` if the host also wants to play.
- A public code is first reserved with the transient `{ gameId, reservedByUid }` shape in a transaction. The following multipath update replaces it with the stable `gameId` string while creating the game. This prevents two clients from claiming the same code and permits only the reserving UID to finalize or release it.
- `settings/roleComposition` stores the host's non-secret pre-game selection as role-id counts. It does not contain player assignments. Only the host can change it, and only while the game remains in the lobby; individual assignments stay under `privatePlayers`.
- `settings/rolesAssignedAt` is a one-time assignment marker written in the same atomic update as the private assignments and the transition to `public/status: in-progress`. It contains no role data.
- `statuses` is a map keyed by `statusId`, rather than an array. Stable keys support targeted updates and validation without rewriting an entire list. The application can normalize this map to the domain array when reading it.
- A night is keyed by a stable `nightId`; `nightNumber` is only its human-readable sequence.
- `actionsRevision` invalidates stale previews. Per-write markers under `pendingActionWrites` close the concurrency window between persisting an Action Log entry and incrementing its revision; resolution is rejected while any marker exists.
- `resolutionApplyingId` is an exclusive per-attempt token claimed transactionally before effects are written; `resolutionApplyingAt` gives the claim a short recovery lease. Repeating an applied resolution is idempotent, while a concurrent, different or stale resolution is rejected.
- `nightResolutions` stores the current administrative view and `nightResolutionVersions` preserves each resolution identity, including rollback metadata.
- Starting a phase persists its public pointer, timer and immutable session record in one multipath update. Pausing or resuming does not create a new session.
- `phaseEndsAt` is an absolute timestamp in milliseconds. Clients derive remaining time locally instead of persisting a decrementing counter.
- A running timer has `phaseEndsAt` and `timerPaused: false`. Pausing removes the end timestamp and stores `timerPaused: true` plus `timerRemainingMs`; ending stores zero remaining time. Clients adjust their local clock with Firebase's server-time offset when available.
- `players/{uid}/disconnected` is a coarse connection hint, not a presence ledger. On the player route, the client marks it `false` after reconnecting and queues `true` with `onDisconnect`. Multiple tabs are intentionally not modeled yet.

Typed records live in `src/lib/firebase/schema.ts`, and all path construction is centralized in `src/lib/firebase/paths.ts`.
