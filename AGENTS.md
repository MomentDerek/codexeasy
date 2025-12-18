# AGENTS Instructions (Codex)

## Scope

- These instructions apply to the entire repository.

## Workflow

- Review `README.md` and the developer docs in `docs/developer/` before changing architecture or patterns.
- Follow established React 19 + Tauri v2 conventions: prefer Zustand for shared UI state and TanStack Query for persisted or backend-driven data.
- Keep code consistent with existing linting/formatting rules; do not wrap imports in `try/catch` blocks.
- Use Bun (lockfile committed) for scripts and dependency changes.

## Testing

- For substantive code changes, run the full suite with `bun run check:all` before finishing work.
- When working on a narrow area, run the most relevant subset (e.g., `bun run lint`, `bun run typecheck`, `bun run test:run`, `bun run rust:fmt:check`, `bun run rust:clippy`, `bun run rust:test`) and note what was executed.
- Documentation-only updates do not require tests but should be called out explicitly.

## Frontend & UX

- Maintain the existing Tailwind v4 + shadcn/ui v4 design system; avoid introducing alternate UI libraries.
- Prefer Zustand's `getState` access patterns to minimize unnecessary React renders, and keep command palette/menu interactions consistent with current patterns.

## Documentation

- Keep `AGENTS.md` as the single source of agent-facing guidance; avoid scattering per-tool instruction files.
- Update relevant docs when changing architecture, commands, or developer workflows to keep guidance aligned with the codebase.
