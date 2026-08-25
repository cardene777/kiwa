# Test parallelism and shared resources

`pnpm -r test` runs packages concurrently (worker count = CPU cores). Some packages
compete for a resource the machine has only one of. When they run at the same time,
tests fail without the implementation having changed.

This document records which packages contend, why serialising them is the chosen
answer, and what was rejected.

## Measured contention

A full sweep on 2026-07-28 produced 15,336 passing tests and 14 failures. All 14 fell
into two groups, and all 14 passed when their package ran alone. Fixing those exposed
more groups underneath — each fix let the run get further before hitting the next shared
resource. Eleven were found in total.

| # | What is shared | How it failed |
|---|---|---|
| 1 | The chain port: 12 examples all declared `8545` | The first to bind wins; the rest exit in 32 ms with `Address already in use` |
| 2 | The web server port: `3042` and `3046` each claimed by two examples | The second start reports `is already used` |
| 3 | `dist/` of `dapp` / `cli`, emptied by `clean` on every build | A concurrent `next build` cannot resolve `@kiwa-lab/dapp` types |
| 4 | `dist/` of every shared dependency, rewritten by 171 targets | A partially written `edge/dist/index.d.ts` reads as `is not a module` |
| 5 | Chromium: `e2e`, `ui` and `examples/full-stack-poc` launch a real one | The launch does not finish inside the budget |
| 6 | The hook budget during Chromium teardown | `--testTimeout` does not cover `beforeAll` / `afterEach`; the 10 s default is not enough |
| 7 | The child process budget in `packages/cli` | Failed at 5004 ms — the 5 s default itself, not a hang |
| 8 | The Docker daemon: `@kiwa-lab/orm` and four `orm-*-poc` examples start containers at once | `Port 3306 not bound after 120000ms` |
| 9 | The Docker daemon during container start-up | `start()` returns before MySQL accepts connections; `prisma db push` is refused |
| 10 | The chain's block production, in `examples/nextjs-staking` | A stake was assumed mined before time was advanced; the balance came back 10 % short |
| 11 | The refresh of one on-screen value, in `examples/nextjs-vesting` | A release was read off a *different* element that had already refreshed; the balance still held the pre-release value |

Groups 9 through 11 are not contention over a named resource. They are assumptions that
happen to hold on an idle machine and stop holding under load, so they surface the same
way — a failure with no change in the implementation. They are covered under
*Assumptions that only hold when the machine is idle* below.

None of the port groups is a slowness problem. Eighteen `anvil` processes started
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

`tsup`'s `clean` empties `dist/` on every build, and 171 targets rebuild their shared
dependencies during `test`. Removing it removes the window (#1741). `cli` and `dapp`
kept it at first because they emit content-hashed chunks, but they are rebuilt by 18
examples too and produced the same failure, so they lost it as well. Stale artifacts are
handled at the only point where they matter: `scripts/clean-dist.mjs` runs at the head of
`release`, before anything is published.

### One build up front instead of 1036

Removing `clean` shrinks the window in which `dist/` is empty, but not the window in
which a file is half written. `tsup` writes to the final path, so a reader can see a
truncated `index.d.ts`. That window is a few milliseconds — and there were 1036 of them
per run, because 171 targets each rebuilt their shared dependencies at the head of their
own `test`, while 171 targets read them concurrently.

The window cannot be removed without changing how `tsup` writes. The number of windows
can. On a full sweep the root `test` exports `KIWA_DEPS_PREBUILT=1` and then runs
`pnpm -r build` once, before anything else. Every pre-build of a shared dependency goes
through `scripts/build-deps.mjs`, which does nothing when that variable is set. One
build, not 1036, and it finishes before the first reader starts.

The variable has to cover the head build too, not just the test phases. Five examples
build a shared dependency as part of their own `build` (`pnpm -F @kiwa-lab/core build &&
next build` and similar), and `pnpm -r build` runs those concurrently with everything
else in the same topological wave. pnpm has already built the dependency by then, so the
nested call is pure redundancy — and a write window against whatever is reading in
parallel. Routing those five through `build-deps.mjs` makes them no-ops under the
variable.

Two of the five (`nuxt-server-routes-full`, `sveltekit-full`) also call `pnpm build` from
their `test`, which put the same rebuild back inside the parallel test phase.

A single package run (`pnpm -F <name> test`) does not set the variable, so it still
builds its own dependencies.

The variable has to be exported rather than prefixed, because a prefix does not carry
across `&&`. The head build and all three phases therefore run inside one `sh -c`.

### Serial phases for the two resources that cannot be split

The root `test` script runs one build and then three phases.

```
export KIWA_DEPS_PREBUILT=1
pnpm -r build
pnpm -r --filter='!e2e' --filter='!ui' --filter='!full-stack-poc' --filter='!<containers>' test
pnpm --workspace-concurrency=1 -F e2e -F ui -F full-stack-poc test
pnpm --workspace-concurrency=1 -F orm -F <the four container examples> test
```

A browser and the Docker daemon are one per machine; no amount of renaming splits them.
Only `@kiwa-lab/e2e`, `@kiwa-lab/ui` and `examples/full-stack-poc` launch a real browser.
On the container side `@kiwa-lab/orm` starts one per test, and four of the nine
`orm-*-poc` examples start one (the SQLite ones do not). Serialising eight targets out of
the 247 that have a `test` script costs the duration of the shorter ones — measured at
roughly +25 % on a ~900 s run, against a run that previously did not finish at all.

Membership of both phases was decided by measurement, not by imports.

Twenty-seven targets touch a browser API; only `full-stack-poc` ran longer than 5 s. The
rest finish in about a second because the browser is never actually started.

Eight targets import `testcontainers`, but only the two that ping the Docker daemon
before starting anything (`packages/orm`'s live-mode suites) actually launch a container.
The rest either reference the types or assert that an unreachable broker is rejected —
`@kiwa-lab/queue`'s equivalent test finishes in 418 ms.

Both lists are pinned by `tests/release-smoke/tests/anvil-port-uniqueness.test.ts`, which
fails if a member is dropped from its serial phase or left in the parallel one.

### Timeouts sized for a loaded machine

Two places used a default that assumes an idle machine.

`packages/cli` ran on Vitest's 5 s per test; the failure was at 5004 ms, i.e. the timeout
itself. It now passes `--testTimeout 30000`, matching `e2e` and `ui`.

Twenty-seven targets that launch a browser had no `--hookTimeout`. `--testTimeout` covers
the test body only, and Chromium is started and stopped in `beforeAll` / `afterEach`, so
the hook default of 10 s applied. Each now passes a hook budget equal to its test budget.

Raising a timeout is the wrong answer when the thing being measured *is* the duration.
Neither of these measures duration — they assert that a process starts and stops.

## Assumptions that only hold when the machine is idle

Two failures were not about a resource being taken. They were about a step being assumed
complete. On an idle machine the assumption happens to hold, so the test passes for
years; under load the gap opens and the test fails somewhere unrelated to the change
being made.

`examples/nextjs-staking` advanced the chain's clock right after clicking *stake*,
having waited for `waitForRpcIdle`. That helper only observes that RPC traffic has
stopped — not that the transaction was mined. Under load the stake landed in a block
*after* the clock moved, so the contract saw an eight-day lock that had not elapsed and
charged the 10 % early-exit penalty. The balance came back as `90e18` instead of
`100e18`. The fix waits for the stake to appear in `staked` before advancing time, by
polling the value rather than sleeping for a fixed period, so it does not depend on how
fast the machine is.

`examples/nextjs-vesting` read a token balance straight after waiting for a *different*
element to show the release had landed. Each on-screen value is fetched independently, so
one refreshing says nothing about the other. Under load the balance still held its
pre-release value, and the release turned up between that read and the next one — making
a no-op second release look like it had paid out (`0n` against `1000e18`). The fix waits
on the element it is about to read.

The same shape appeared in two more tests that had not yet failed: one asserted a partial
release was above zero after a fixed 1.5 s wait, the other compared a contract address
across a chain switch after waiting on the chain *name*. Both now wait on the value they
read. `tests/release-smoke/tests/anvil-port-uniqueness.test.ts` scans every example spec
for the pattern — a value read into a variable after a click, compared in an assertion,
with no wait on that element in between. Tests that assert a value is *unchanged* are
exempt, because the change they would wait for does not exist by construction.

`testcontainers`' `start()` resolves when the container is up, which is earlier than
MySQL or Postgres accepting connections; the two are separated by the database's own
initialisation, and a busy daemon widens the gap. `prisma db push` was refused with
`Please make sure your database server is running at localhost:33562`. The fix retries
`db push` itself for up to 120 s, only while the output says the connection was refused.
Retrying the real operation rather than probing the port separately keeps *up* and
*usable* from being confused, and any other failure (a bad schema, say) reproduces
immediately instead of being retried into a timeout.

## Timing assertions do not belong in a suite that runs alongside other work

`tests/release-smoke` used to start real performance suites. Three of its cases invoked
`scripts/kiwa-taxonomy-run.mjs`, which runs the perf tests of `packages/ui` and
`packages/cache` — and those assert on elapsed time (`p95 < 1 ms` for a
`performance.now()` round trip, `max latency < 5 ms` for a hundred small allocations).

The failure rate tracked how busy the machine was.

| How it was run | Result |
|---|---|
| `packages/ui` alone, 10 times | 10 pass |
| With `--reporter=json`, 10 times | 10 pass |
| Through `spawnSync` with piped output, 10 times | 10 pass |
| Through the CLI, 10 times | 9 pass, 1 fail |
| Through the CLI with 12 cores saturated, 3 times | 3 fail |

Serialising the file within release-smoke was tried first and was not enough — 2 failures
in 6 runs.

Serialising never removes contention from outside the repository; it removes this
repository's own contribution, and that is true of the browser and Docker cases as well
(the Docker daemon is shared with everything else on the machine — see below). What
differs is what the test does with the load that remains.

A functional test can absorb it. "Chromium starts", "port 3306 binds", "the transaction is
mined" are all statements about something happening, so a budget generous enough for a
loaded machine keeps them true without weakening what they assert. A timing assertion
cannot: the load *is* what it measures. Widening the budget until unrelated work fits
inside it is the same as deleting the test.

Raising the thresholds is therefore not an option here, for the reason stated above.

So the timing assertions left. release-smoke checks that the CLI parses its arguments and
resolves the right targets; the numbers are `pnpm test:perf`'s job, which already runs
with `--workspace-concurrency=1`. The file's own header comment said as much from the
start ("CLI 本体の実 run は per-category に委ね、release-smoke は CLI 存在 + 引数 parse
動作を担保する薄い gate") — the implementation had drifted from it.

What the three cases became:

| Was | Now |
|---|---|
| `--category perf --lib ui` had to report `pass`, to prove `.tsx` files are collected | `collectFiles` is called directly and asserted to return both `ui.perf.tsx` and `ui.skill.test.ts` |
| `--category all --lib cache` ran all four categories for real | `--lib lean` has no test directory in any category, so every cell returns `no-files` and only the output shape is exercised — guarded by an assertion that those directories still do not exist |
| `--category skill --lib cache` had to report `pass` | `test-taxonomy.config.json` is read directly. `--lib` bypasses the config entirely, so a row in the matrix never meant "in scope" |

Dropping the real runs left a gap: the CLI's own perf adapter (`runPerfCell`) builds the
Vitest command, parses its JSON, and maps the counts to a status, and nothing else
exercises it — `pnpm test:perf` invokes each package's `test:perf` directly. It now takes
its runner as an argument, so a stubbed runner returning fixed JSON pins the command
arguments, `pass` / `fail` / `no-tests` / `parse-fail`, the `KIWA_MODE` propagation, and
the early return when no perf config exists. None of that depends on elapsed time.

Under the saturated-CPU condition that used to fail three times out of three, the file now
passes three times out of three, and 543 release-smoke tests pass across three
consecutive runs (#1751).

## A precondition this repository cannot enforce

The Docker daemon is shared with everything else on the machine. During one measured run
25 containers belonging to other projects were up, and a MySQL container for
`orm-drizzle-mysql-poc` did not bind port 3306 within 120 s. Serialising this
repository's own container starts removes its contribution; it cannot free capacity that
something else is holding.

The same 25 containers were up when `@kiwa-lab/orm` was found to be starting containers
from the parallel phase. Its first test spent 153 s failing to bind 3306 while the rest
of the suite ran, and the six tests after it — by which point the parallel phase had
thinned out — took 9 to 27 s each. A failure at the daemon and a failure at the parallel
phase look identical from the test output; the difference showed up in the timings.

If the sweep fails on a container timeout, check `docker ps` before reading it as a
regression.

### `scripts/test-all.mjs --jobs N`

The reporting sweep was serial for the reason in group 4: 171 targets rewriting the
`dist/` of every shared dependency. Its own header said so, and pointed at
`typecheck-all.mjs`, which kept a `--jobs` flag and invented red packages that passed
when run alone.

`--jobs N` runs it in parallel by removing that cause rather than hoping. The sweep
builds the workspace once up front and sets `KIWA_DEPS_PREBUILT=1` for every child,
which is the same fix the root `test` script uses (§ One build up front instead of 1036).
The default stays 1, so the order and the reporting are exactly as before unless the
flag is given.

**The up-front build is not tied to `--jobs`.** It ran only in parallel mode at first,
which hid a saving behind a flag: measured on 166 targets, the per-target builds it
replaces cost 221 s — 17.8% of a serial run, and none of it about concurrency. It now
runs whatever `--jobs` says. A `--only` run skips it, because the build costs 19 s
against roughly 1.3 s per target and a short target list cannot repay that; `--jobs`
above 1 overrides the skip, since two targets without it rewrite the same `dist`.

A failed build means different things in the two modes. Serial reports it and carries
on — each package builds its own dependencies, which is what it did before the flag
existed, so the failure costs time and not correctness. Parallel stops, because there
the build is what keeps two targets off the same `dist`.

What is left after the build is removed are the two resources that cannot be split, and
each gets a lane of its own that stays serial. Across all lanes together, no more than
`N` targets run at a time.

| Lane | How membership is decided | Members today |
|---|---|---|
| Docker | Read from `package.json`: a target that declares `testcontainers` or `@testcontainers/*` | 7 |
| Chromium | A written list, `CHROMIUM_LANE` in the script, pinned to the root `test` script's serial phase by a check | `packages/e2e`, `packages/ui`, `examples/full-stack-poc` |

The two are decided differently because only one of them can be read. A dependency on
`testcontainers` is a declaration in a file, and reading it keeps the lane right the day
a package starts using containers. It over-serialises: the measurements above found two
targets that actually start a container, and seven declare the dependency. That is five
targets running one after another for no reason, and it is the price of a lane that
cannot silently go stale.

Chromium has no such declaration. 46 targets depend on `@playwright/test` and the
dependency says nothing about whether `pnpm test` launches a browser. The three named are
the ones measured as contending (group 5 above). Naming them means a rename can quietly
empty the lane — so the script refuses to start when a name matches nothing in the
workspace. It is checked against the whole workspace rather than against the targets being
run, or `--only lean --jobs 4` would refuse to start for lack of a browser it was never
going to launch.

**`playwright test` in the test command is not the criterion**, though it looks like the
readable signal the docker lane has. 17 examples run it, and the root `test` script runs
all 17 in its *parallel* phase: they were group 1 (a shared chain port), fixed by giving
each one its own number, not group 5. Serialising them would contradict the measurement
above and cost far more than it saves. `--jobs N` is also strictly less concurrent than
the root script, which runs those 17 at `--workspace-concurrency` = core count, so the
lane never needs to be wider than the root script's own serial phase.

That relationship is what pins the written list. A check reads the root `test` script,
takes every target inside a `--workspace-concurrency=1` phase, and requires each one to
land in a serial lane here. The list cannot go stale without the root script changing
first, and if it does, the check names the target that fell through.

**Parallel mode cannot say which package dirtied the tree.** Attribution comes from
reading `git status` before and after each package, and that means nothing when several
are running. The sweep still reads the tree around the whole run, still fails, and still
names the paths — but finding the owner means re-running with `--jobs 1`. It prints that
instruction rather than leaving the reader to work it out.

Measured on 166 packages: 1244 s at `--jobs 1` against 294 s at `--jobs 4`, with the
same verdict line (`green: 166   red: 0   dirty: 0   not run: 0`) from both. The floor
is the serial lanes, so raising `--jobs` past that stops helping.

Exit codes distinguish the two ways a run can end badly: 1 means the sweep found
failures, 4 means the invocation was wrong (`--jobs 0`, a flag with no value, an `--only`
that matches nothing). Both used to be 1, so a caller that retries on failure would retry
a typo forever.

### `next build` を毎回やり直さない

`examples/nextjs-*` 22 件が全 sweep の 532.5 秒 = 52% を占める。 各 target の
`playwright.config.ts` が `webServer.command` に `pnpm build` を持ち、テストのたびに
production build を丸ごと回していた。 `examples/nextjs-bridge` を単体で測ると 49.6 秒のうち
15 秒がこの build で、`workers: 1` なので browser の並列度は関係ない。

`scripts/next-build-cached.mjs` が入力の指紋を取り、前回と同じなら `.next` を再利用する。
仕組みは `scripts/lib/input-fingerprint.mjs` (coverage 成果物で実運用中) と同じで、違うのは
**git が見ない入力を足している**点にある。

| 入力 | 読み方 | なぜ要るか |
|---|---|---|
| tracked な内容 (例 / `packages` / lockfile) | `computeInputFingerprint` | source が変われば build 結果も変わる |
| env file (`.env*` と `.context/*.env`) | 名前を列挙して直接 hash | `tests/prepare-env.ts` が contract address を書き、`NEXT_PUBLIC_*` は **build 時に埋め込まれる** |
| `NEXT_PUBLIC_*` の process env | `process.env` から集めて hash | `NEXT_PUBLIC_X=1 pnpm build` は file を経由しない |

`NEXT_PUBLIC_*` の出所はこの 2 つしかないので、両方を覆えば埋め込み値は完全に覆える。
env file は gitignore 済 (使い捨て chain の address を持つため) なので、git 由来の指紋だけでは
昨日の address を埋めた build がそのまま配られる。

**依存 package の `dist` は入力にしない**。 gitignore 済で、hash すると同じ source から
build し直しただけで無効化される。 代わりに package の source を入力に含める = 成果物ではなく
それを生んだ内容を指紋にする、という coverage gate と同じ論理。

**分からない時は build する**。 `.next/BUILD_ID` が無い / 記録が無い / 記録が読めない /
記録の schema を知らない / git が指紋を作れない、のいずれも build に倒す。 不要に build する
費用は 15 秒で、入力が動いたのに skip する費用は「無いはずの code に対する緑」 になる。

実測は `examples/nextjs-token-gating` で 17 秒 → 0 秒 (2 回目)。

## Rejected

| Option | Why not |
|---|---|
| Run everything sequentially (`scripts/test-all.mjs`) | The sweep is for reporting every failure, not for speed. Measured on 166 packages it takes 1244 s serially against 294 s with `--jobs 4`; since #2215 it takes that flag and is no longer serial by necessity |
| Serialise every package that mentions `anvil` | 21 packages and examples match. Most are gated on the binary being present, and serialising them all costs far more than the two that actually contend |
| Give `getFreePort` a retry loop | The failure was the test timeout, not port exhaustion. `getFreePort` already retries 50 times and serialises its own allocations through a promise chain |
| Raise the browser timeout instead of serialising | `e2e` and `ui` already use 30 s and still exceeded it under full parallel load. The launch is genuinely starved, not merely slow |
| Replace real browsers with mocks | These tests exist to check behaviour in a real browser |
| Raise the chain start timeout | Eighteen `anvil` processes started at once all reach `listen` within 1.1 s. The 10 s default already has nine times the headroom; the ports were the problem |
| Serialise the 18 examples that start a chain | Giving each one its own port keeps them parallel and costs nothing |
| Keep `clean` on `dapp` / `cli` | 18 examples rebuild them mid-run, and `dist/` is empty for the duration. Stale output is a publishing concern, and `scripts/clean-dist.mjs` already handles it at the head of `release` |
| Make the dependency build atomic (write to a temp path, then rename) | It requires changing how `tsup` writes, with a blast radius that could not be bounded. Cutting 1036 builds to 1 removes the same failure |

## Adding a package that contends

Move it into the second phase of the root `test` script. A package belongs there when it
starts something the machine has one of — a browser, a listener on a fixed port, a
device. A package that spawns an ordinary child process does not; give it a timeout that
survives a loaded machine instead.

If a test waits for something to finish, check what the wait actually observes. Traffic
going quiet, a process being up, or a file existing are each weaker than the thing being
waited for, and the difference only shows under load.
