# Player connection tracking

The player route restores a session from three stable values: the room code in the URL, the persisted anonymous Firebase UID, and the public player record stored at `games/{gameId}/players/{uid}`. Nickname and experience are read from that record and are never requested again during restoration.

Connection state intentionally uses only the Realtime Database primitives needed for refresh and temporary network loss:

1. Observe `.info/connected` for this browser connection.
2. When connected, queue `disconnected: true` with `onDisconnect`.
3. Only after the server accepts that operation, write `disconnected: false`.

The `onDisconnect` operation remains attached to the underlying Firebase connection when the React listener is removed. This preserves the server-side disconnect write during refresh or tab closure.

This is not a complete presence system. The boolean is a coarse hint and does not distinguish multiple tabs or devices using the same anonymous UID. A future presence implementation can store one connection key per tab and derive aggregate online state without changing the public player identity.
