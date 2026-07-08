# kiwa v2.0 x-thread (English)

## Tweet 1

kiwa v2.0 is out — **brand shortening rename**. All 41 kiwa packages migrated from `@kiwa-test/*` to `@kiwa/*` with a synchronized v2.0.0 major bump. API 0 changes, shape contract preserving, backward compat absolute (deprecated re-export 6-month grace window, 2026-07-08 → 2027-01-08).

## Tweet 2

Pure rename milestone, 5 PR exception expansion (4 PR rhythm paused only for rename milestone, resumes at v2.1+). 1424 file + 900+ reference changes across packages / workspace internal dep / docs / dogfood / tests. Zero semantic changes.

## Tweet 3

`pnpm add -D @kiwa/core@^2.0` for new consumers. Existing consumers can migrate immediately (sed replace) or use the 6-month grace period (@kiwa-test/* v2.0.0 deprecated shim publishes @kiwa/* as re-export).

## Tweet 4

Why rename: `@kiwa-test/*` implied test-only scope, mismatches future scope expansion. `@kiwa/*` is shorter, more brand-aligned. 45 milestone streak + depth-5 3rd case + depth-6 2nd case candidate compound assets continue in kiwa brand.

Lean formal verification integration comes as a separate library later, kiwa core stays testing-focused.

Migration: https://cardene777.github.io/kiwa/migrations/v2.0-rename-plan

#kiwa #v2 #rename #testing #vitest
