# Firebase adapters

- `config.ts` reads and validates the public Firebase Web configuration.
- `client.ts` initializes the modular Web SDK once.
- `auth.ts` exposes the typed Authentication instance.
- `database.ts` exposes the typed Realtime Database instance and validates its URL only when the database adapter is used.
- `schema.ts` describes the persisted JSON records without implementing reads or writes.
- `paths.ts` centralizes typed database paths.
- `references.ts` creates database references from those paths.
- `realtime-database-repository.ts` exposes typed observers and atomic multi-path updates.
- `realtime-database-error.ts` normalizes infrastructure errors with operation and path context.

Authentication flows and database operations belong in their corresponding feature modules, not in this integration layer.
