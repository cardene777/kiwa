# Release invariants SSOT — 3 rules that turn a 4-time recurring bug into an invariant for kiwa v1.29

Introduced in v1.29 as `@kiwa-test/release-invariants` v0.1 — 3 pure invariant checkers (`checkReleaseScriptFilter` + `checkProvenanceFlagAbsence` + `checkGateScriptPackageCoverage`) + a 1-shot `buildReleaseInvariantsSummary` aggregator. This document is the SSOT for **what the release gate measures, why each invariant matters, and how the systematic root cause pattern converged after 4 rediscoveries**. Every downstream release-smoke suite (`tests/release-smoke/tests/release-script-filter.test.ts` v1.29-1, `tests/release-smoke/tests/v1-29-publish.test.ts` v1.29-3) and every migration path (`docs/migrations/v1.28-to-v1.29.md`) reads these rules from here — do not re-derive them locally.

## Why an SSOT

Release scripts without a shared standard fail three ways.

- **Filter symmetry drift**. `pnpm -F {name} build` (build filter) + `pnpm publish --filter {name}` (publish filter) are two separate half-scripts. A well-meaning contributor adds a new package to one half and moves on. The release runs green — the build produces the artefact, the publish command exits 0 because the package it was told about (or was not told about) succeeded. The registry never receives the new package. v1.14 payment, v1.25 perf-harness, v1.27 quality-metrics, v1.28 realtime each hit this bug independently. Each was a follow-up fix within the same milestone.
- **Provenance flag creep**. npm CLI 10+ introduced `--provenance` for OIDC-federated release signing. Inside pnpm monorepos + GitHub Actions, the OIDC federation is not stable — the token is refused and the release exits non-zero mid-milestone. v1.14 removed the flag. Every subsequent milestone risks a contributor re-adding it because "npm docs say to use it".
- **Gate script coverage drift**. `test:mutation` (root `package.json`) drives the mutation baseline the release gate consumes. If it omits a publishable package, the gate reads a baseline that is missing that package's kill-rate. The gate passes on partial data — the mutation regression only surfaces after the next milestone tries to trace which package regressed and finds no baseline entry.

The 3 rules below are the smallest set that make kiwa release scripts comparable across milestones, forks, and downstream users.

## Rule 1 — release script filter symmetry

Every publishable `@kiwa-test/*` package must appear in **both** halves of `scripts.release`.

- Build half — `pnpm -F @kiwa-test/{name} build ... build && ...`
- Publish half — `pnpm publish --filter @kiwa-test/{name} --filter ...`

A half-only entry is the exact failure mode v1.14 / v1.25 / v1.27 / v1.28 all rediscovered.

`checkReleaseScriptFilter(releaseScript, publishable)` returns.

- **`ok: boolean`** — AND of every entry's `ok`. `true` iff every package appears in both halves.
- **`entries: ReleaseScriptFilterEntry[]`** — per-package rows with `buildFilterPresent` + `publishFilterPresent` + `ok` + `partial`. `partial: true` means one half present, one half missing — the exact failure mode.
- **`missingBuildFilter: string[]`** — names to add to the `-F` half. Actionable for a failure message.
- **`missingPublishFilter: string[]`** — names to add to the `--filter` half.

The check is pure — no filesystem access, no side effects. Callers supply the release script and the publishable package list from wherever they source them.

```ts
import {
  checkReleaseScriptFilter,
  type PublishablePackage,
} from '@kiwa-test/release-invariants';

const PUBLISHABLE: PublishablePackage[] = [
  { name: '@kiwa-test/core' },
  { name: '@kiwa-test/realtime' },
];

const releaseScript =
  'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
  'pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime';

const result = checkReleaseScriptFilter(releaseScript, PUBLISHABLE);
// result.ok === true, missingBuildFilter === [], missingPublishFilter === []
```

## Rule 2 — provenance flag absence

`--provenance` must not appear next to `pnpm publish` in the release script. v1.14 removed it; every subsequent milestone risks a contributor re-adding it.

`checkProvenanceFlagAbsence(releaseScript)` returns.

- **`ok: boolean`** — `true` iff `--provenance` is not present.
- **`provenanceFlagPresent: boolean`** — inverse of `ok`.
- **`excerpts: string[]`** — up to 3 40-char windows around each `--provenance` match. Used in failure messages so the offending location is obvious.

```ts
import { checkProvenanceFlagAbsence } from '@kiwa-test/release-invariants';

const releaseScript =
  'pnpm publish --filter @kiwa-test/core --provenance --access public';
const result = checkProvenanceFlagAbsence(releaseScript);
// result.ok === false, result.excerpts[0] contains the offending context
```

## Rule 3 — gate script package coverage

Every publishable package must appear in `scripts.test:mutation` (root `package.json`). The mutation gate reads baseline entries from every package the script visits — a missing entry means the gate silently skips that package's mutation regression check.

`checkGateScriptPackageCoverage(mutationGateScript, publishable)` returns.

- **`ok: boolean`** — AND of every entry's `mutationFilterPresent`.
- **`entries: GateScriptPackageCoverageEntry[]`** — per-package rows with `mutationFilterPresent`.
- **`missingMutationFilter: string[]`** — names to add to the mutation gate script.

```ts
import {
  checkGateScriptPackageCoverage,
  type PublishablePackage,
} from '@kiwa-test/release-invariants';

const PUBLISHABLE: PublishablePackage[] = [
  { name: '@kiwa-test/core' },
  { name: '@kiwa-test/realtime' },
];

const mutationGateScript =
  'pnpm -F @kiwa-test/core -F @kiwa-test/realtime run test:mutation';

const result = checkGateScriptPackageCoverage(mutationGateScript, PUBLISHABLE);
// result.ok === true
```

## Rule 4 — 1-shot summary via `buildReleaseInvariantsSummary`

Downstream release-smoke suites usually want a single boolean plus the 3 sub-results in one call. `buildReleaseInvariantsSummary` is the SSOT aggregator.

```ts
import {
  buildReleaseInvariantsSummary,
  type PublishablePackage,
} from '@kiwa-test/release-invariants';

const summary = buildReleaseInvariantsSummary({
  releaseScript,
  mutationGateScript,
  publishable: PUBLISHABLE,
});
// summary.ok === true iff every invariant holds
// summary.releaseScriptFilter, summary.provenanceFlagAbsence,
// summary.gateScriptPackageCoverage are the 3 sub-results verbatim
```

The 4 rules together — 3 invariants + 1 aggregator — are exactly what the v1.29-1 fail-fast release-smoke suite (`release-script-filter.test.ts`) checks per-package + what v1.29-3 layer on top for the 3-invariant SSOT.

## The systematic root cause pattern — 4 rediscoveries + 1 SSOT

The v1.29 milestone did not invent these invariants. It named a pattern that had already recurred four times.

| milestone | package | miss | fix PR | pattern application |
|---|---|---|---|---|
| v1.14 | `@kiwa-test/payment` | build filter present, publish filter missing | #912 (v1.23 follow-up) | 1st |
| v1.25 | `@kiwa-test/perf-harness` | proactive add to both halves during rollout | #932 | 2nd (proactive) |
| v1.27 | `@kiwa-test/quality-metrics` | build filter present, publish filter missing | #961 | 3rd (reactive again) |
| v1.28 | `@kiwa-test/realtime` | build filter present, publish filter missing | #976 | 4th |
| v1.29-1 | 6 legacy misses (`agent` / `ai-llm` / `component` / `mcp` / `search` / `streaming`) | build filter present, publish filter missing | #989 | fail-fast test axis |
| v1.29-3 | — | none new — SSOT + 7-milestone snippet validation | this milestone | SSOT + docs |

The retrospective (vault `decisions/personal/2026-07-05-kiwa-v1.28-milestone-retrospective.md`) surfaced the pattern. The v1.29 sprint had 3 sub-milestones.

- **v1.29-1** — release-smoke axis `release-script-filter.test.ts` with dynamic package discovery + 40 per-package assertions. Fail-fast, before milestone finisher. Landed 6 previously-missing packages in the same PR (agent / ai-llm / component / mcp / search / streaming).
- **v1.29-2** — PostToolUse hook `release-script-filter-guard.sh` + `/issue-plan` checklist SSOT for new package additions. Proactive prevention, before test.
- **v1.29-3** — this milestone. `@kiwa-test/release-invariants` v0.1 SSOT + `docs/tutorials/55-release-script-filter-ssot.md` walkthrough + `docs/concepts/release-invariants.md` (this doc) + `docs/migrations/v1.28-to-v1.29.md` migration path + 7-milestone snippet validation streak (v1.23 → v1.29) via `packages/release-invariants/tests/docs-tutorial-v1.29.test.ts`.

## Rule 5 — 7-milestone snippet validation streak

Every tutorial code snippet in `docs/tutorials/*` must be executable against the real npm package API. Drift between the tutorial and the actual export shape is the exact failure mode "tutorial says X but the API is Y" — readers who paste the snippet get a compilation error.

The pattern started in v1.23 with `packages/payment/tests/docs-tutorial-v1.23.test.ts`. Each subsequent milestone repeated it — v1.24 edge, v1.25 perf-harness, v1.26 orm, v1.27 quality-metrics, v1.28 realtime. v1.29 makes it a 7-milestone streak with `packages/release-invariants/tests/docs-tutorial-v1.29.test.ts`.

The streak is the SSOT for structural drift blocking — a milestone that lands a tutorial without a matching snippet-validation test breaks the pattern.

## What this SSOT does not solve

- **Package name discovery.** The invariants take the publishable list as input. Sourcing the list is the caller's problem — pnpm monorepos usually walk `packages/*/package.json` and filter by `@scope/*` prefix + `private: false`. `tests/release-smoke/tests/release-script-filter.test.ts` demonstrates the pattern for kiwa.
- **npm registry state.** The invariants check the release script text, not what npm shipped. If a package appears in both halves but a prior publish attempt failed and left the registry stale, the invariant will report `ok: true`. Registry state is a separate check (`registry.npmjs.org/{name}/latest`).
- **Version bumping.** The invariants do not check whether the package's `version` in `packages/{name}/package.json` bumped from the last release. That is a separate axis — v1.28's release-smoke `v1-28-publish.test.ts` covers it for the primary publish surface per milestone.

## Related SSOTs

- `docs/tutorials/55-release-script-filter-ssot.md` — 15-min walkthrough for the 3 invariants using a mock adapter + a file adapter.
- `docs/migrations/v1.28-to-v1.29.md` — additive, non-breaking, opt-in migration from v1.28 to v1.29.
- `tests/release-smoke/tests/release-script-filter.test.ts` — v1.29-1 per-package fail-fast axis (40 tests).
- `tests/release-smoke/tests/v1-29-publish.test.ts` — v1.29-3 publish artefact + 3-invariant summary check.
- `packages/release-invariants/tests/docs-tutorial-v1.29.test.ts` — 7-milestone snippet validation streak.
