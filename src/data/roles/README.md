# Role catalog

Static role definitions are grouped by faction and exported through `index.ts`. Runtime assignments and private player state remain outside the catalog.

The catalog contains all 25 roles and all 39 copies from the physical card game. Every definition carries its printed Virtue Value, physical copy count, beginner-facing rules, important interactions, investigative appearance, and assisted-mode action metadata.

Mechanical fields that are not confirmed by the project specification use the explicit `needs-verification` sentinel and include verification notes. They must not be consumed by the Game Engine as real rules until verified against the physical edition used by the project.
