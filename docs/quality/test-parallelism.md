# Test parallelism and shared resources

`pnpm -r test` runs packages concurrently (worker count = CPU cores). Some packages
compete for a resource the machine has only one of. When they run at the same time,
tests fail without the implementation having changed.

This document records which packages contend, why serialising them is the chosen
answer, and what was rejected.

## Measured contention

A full sweep on 2026-07-28 produced 15,336 passing tests and 14 failures. All 14 fell
into two groups, and all 14 passed when their package ran alone.

| Group | Packages | Symptom |
|---|---|---|
| Browser launch | `@kiwa-lab/e2e`, `@kiwa-lab/ui` | `setupE2eEnv (browser / headless options)` T-E2E-007 through 021, `setupBrowserComponentEnv (chromium, headless)` |
| Process spawn | `@kiwa-lab/cli` | `runAnvilSeed > T-ASD-006 getFreePort` timed out at 5004 ms |

`packages/ui` ran its chromium tests alone three times in a row and passed every time.
The same full sweep, repeated, exited 0 on the second attempt.

## What the repository does about it

### Browser launch — run the two packages one at a time

The root `test` script runs in two phases. Everything except `e2e` and `ui` runs in
parallel as before; those two then run with `--workspace-concurrency=1`.

```
pnpm -r --filter='!@kiwa-lab/e2e' --filter='!@kiwa-lab/ui' test
pnpm --workspace-concurrency=1 -F @kiwa-lab/e2e -F @kiwa-lab/ui test
```

Only these two packages call `engine.launch()` (`packages/e2e/src/browser-bridge.ts`,
`packages/ui/src/browser.ts`). `auth` and `cli` mention browser types in their tests but
never start one, so they stay in the parallel phase.

Serialising two packages out of 169 costs the duration of the shorter one. The same
shape already exists for performance measurement (`test:perf` uses
`--workspace-concurrency=1` for every package) — that one serialises everything because
measurement is sensitive to any concurrent load, which is not true of correctness tests.

### Process spawn — give the timeout room for a loaded machine

`packages/cli` used Vitest's default 5 s per test. A test that spawns a process and
allocates a port needs more than that when the machine is saturated: the failure was at
5004 ms, i.e. the timeout itself, not a hang.

Its `test` and `test:cov` now pass `--testTimeout 30000`, matching `e2e` and `ui`.

Raising a timeout hides a real slowdown, so it is the wrong answer when the thing being
measured *is* the duration. Here the test asserts that a port gets allocated, not how
fast — the timeout only has to be longer than the slowest legitimate run.

## Rejected

| Option | Why not |
|---|---|
| Run everything sequentially (`scripts/test-all.mjs`) | A sequential sweep takes the better part of an hour. The parallel one takes minutes |
| Serialise every package that mentions `anvil` | 21 packages and examples match. Most are gated on the binary being present, and serialising them all costs far more than the two that actually contend |
| Give `getFreePort` a retry loop | The failure was the test timeout, not port exhaustion. `getFreePort` already retries 50 times and serialises its own allocations through a promise chain |
| Raise the browser timeout instead of serialising | `e2e` and `ui` already use 30 s and still exceeded it under full parallel load. The launch is genuinely starved, not merely slow |
| Replace real browsers with mocks | These tests exist to check behaviour in a real browser |

## Adding a package that contends

Move it into the second phase of the root `test` script. A package belongs there when it
starts something the machine has one of — a browser, a listener on a fixed port, a
device. A package that spawns an ordinary child process does not; give it a timeout that
survives a loaded machine instead.
