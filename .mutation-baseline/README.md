# .mutation-baseline/

Per-package baseline snapshots of Stryker mutation-testing runs.

Layout: `.mutation-baseline/<pkg>.json` — the last known green Stryker report for `@kiwa/<pkg>`.

Each baseline records:

- `killRate` — killed / (killed + survived + timeout + error)
- `killed` / `survived` / `timeout` / `error` — mutant counts
- `thresholds` — `high` / `low` / `break` copied from that run
- `mutants` — list of surviving mutant descriptors (path + line + mutator)
- `capturedAt` — ISO 8601 timestamp of the run
- `tier` — Core / Framework / SaaS / Test type (see `docs/quality/mutation-thresholds.md`)

`pnpm test:mutation` runs each package's `stryker run` command; the baseline is refreshed inside the PR that raises kill-rate, never as a standalone commit.

Baselines are tracked so mutation-rate regressions surface as file-level `git diff` in PRs. The `mutation-report/` (HTML + `.stryker-tmp/` scratch) is `.gitignore`d — only the baseline JSON is committed.

## SSOT

- `docs/quality/mutation-thresholds.md` — 4-tier threshold rationale.
- `packages/*/stryker.config.mjs` — per-package Stryker configs (each names its tier in the header comment).
- root `package.json` `test:mutation` — pnpm filter list across all packages with a baseline here.
