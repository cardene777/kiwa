# Test parallelism and shared resources

`pnpm -r test` runs packages concurrently (worker count = CPU cores). Some packages
compete for a resource the machine has only one of. When they run at the same time,
tests fail without the implementation having changed.

This document records which packages contend, why serialising them is the chosen
answer, and what was rejected.

## Measured contention

A full sweep on 2026-07-28 produced 15,336 passing tests and 14 failures. All 14 fell
into two groups, and all 14 passed when their package ran alone. Fixing those exposed
three more groups underneath — each fix let the run get further before hitting the next
shared resource.

| Group | What is shared | How it failed |
|---|---|---|
| Local chain port | 12 examples all declared `8545` | The first to bind wins; the rest exit in 32 ms with `Address already in use` |
| Web server port | `3042` and `3046` each claimed by two examples | The second start reports `is already used` |
| `dist/` of `dapp` / `cli` | 18 examples rebuild `dapp` mid-run | A concurrent `next build` cannot resolve `@kiwa-lab/dapp` types |
| Browser launch | Chromium | `@kiwa-lab/e2e` and `@kiwa-lab/ui` time out launching |
| Hook budget | Chromium teardown | `--testTimeout` does not cover `beforeAll` / `afterEach`; the default 10 s is not enough |
| Docker | The daemon | Four `orm-*-poc` examples start MySQL / Postgres containers at once |

None of the first three is a slowness problem. Eighteen `anvil` processes started
concurrently reach `listen` in 128 ms on an idle machine and 1,099 ms with every core
busy — the 10 s default has nine times the headroom it needs. What broke was that they
all asked for the same number.

## What the repository does about it

### One number per example

Each example that starts a local chain owns a distinct port (`8560`-`8571`), and each
web server likewise. `tests/release-smoke/tests/anvil-port-uniqueness.test.ts` fails if
two examples ever claim the same one, or if an example's own start and listen
declarations disagree.

### `clean` is off everywhere

`tsup`'s `clean` empties `dist/` on every build, and 169 packages rebuild their shared
dependencies during `test`. Removing it removes the window (#1741). `cli` and `dapp`
kept it at first because they emit content-hashed chunks, but they are rebuilt by 18
examples too and produced the same failure, so they lost it as well. Stale artifacts are
handled at the only point where they matter: `scripts/clean-dist.mjs` runs at the head of
`release`, before anything is published.

### Serial phases for the two resources that cannot be split

The root `test` script runs in three phases.

```
pnpm -r --filter='!e2e' --filter='!ui' --filter='!orm-*-poc' test
pnpm --workspace-concurrency=1 -F e2e -F ui test
pnpm --workspace-concurrency=1 -F <the four container examples> test
```

A browser and the Docker daemon are one per machine; no amount of renaming splits them.
Only `@kiwa-lab/e2e` and `@kiwa-lab/ui` call `engine.launch()`, and only four of the nine
`orm-*-poc` examples start a container (the SQLite ones do not). Serialising six packages
out of 169 costs the duration of the shorter ones — measured at roughly +25 % on a
~900 s run, against a run that previously did not finish at all.

### Timeouts sized for a loaded machine

Two places used a default that assumes an idle machine.

`packages/cli` ran on Vitest's 5 s per test; the failure was at 5004 ms, i.e. the timeout
itself. It now passes `--testTimeout 30000`, matching `e2e` and `ui`.

Twenty-seven targets that launch a browser had no `--hookTimeout`. `--testTimeout` covers
the test body only, and Chromium is started and stopped in `beforeAll` / `afterEach`, so
the hook default of 10 s applied. Each now passes a hook budget equal to its test budget.

Raising a timeout is the wrong answer when the thing being measured *is* the duration.
Neither of these measures duration — they assert that a process starts and stops.

## A precondition this repository cannot enforce

The Docker daemon is shared with everything else on the machine. During one measured run
25 containers belonging to other projects were up, and a MySQL container for
`orm-drizzle-mysql-poc` did not bind port 3306 within 120 s. Serialising this
repository's own container starts removes its contribution; it cannot free capacity that
something else is holding.

If the sweep fails on a container timeout, check `docker ps` before reading it as a
regression.

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
