# Perf thresholds — SSOT

## Why this file exists

The previous perf-harness rollout (v1.13-1 / v1.14-1) picked p95 thresholds by feel — `20ms` for realtime, `40ms` for AI-LLM mocks, `50ms` for dogfood adapter joins. Those numbers had no external justification, so a passing report proved nothing beyond "the mock is not catastrophically slow".

This doc pins **every** perf threshold in kiwa to one of three grounded rationales:

1. **Provider SLA** — the third-party API kiwa mocks documents its own p99 latency. The kiwa threshold sits at or under that so a passing mock behaves at least as fast as the real thing.
2. **Human-perception target** — for user-facing SaaS surfaces (chat, cursor, notification), Jakob Nielsen's classic thresholds apply: 100 ms feels instant, 1 s keeps flow, 10 s loses users. Kiwa targets the strictest applicable band.
3. **Mock-invariant** — a mock is in-memory code. Its perf floor is the JS engine's own event-loop tick + heap allocation cost. When a mock's p95 exceeds this floor by more than one order of magnitude, something is architecturally wrong (e.g. accidentally awaiting a promise chain per call). Kiwa targets < 10 × the JS floor.

## Threshold table

| Target | Op | p95 threshold | Rationale |
|---|---|---|---|
| `@kiwa-lab/quality-metrics` | `evaluateReleaseGate` | 5 ms | mock-invariant (pure calculation, one heap object per call) |
| `@kiwa-lab/quality-metrics` | `diffReports` | 5 ms | mock-invariant |
| `@kiwa-lab/ai-llm` | `anthropic.messages.create` (mock) | 40 ms | provider SLA — Anthropic Messages p95 non-streaming is ~600ms; mock must be < 10 % of live so tests do not become the bottleneck |
| `@kiwa-lab/ai-llm` | `openai.chat.completions.create` (mock) | 40 ms | provider SLA — OpenAI Chat Completions p95 is ~500-1200ms depending on model; same 10 % rule |
| `@kiwa-lab/ai-llm` | `vercel.generateText` (mock) | 40 ms | provider SLA — proxies to Anthropic / OpenAI, same target |
| `@kiwa-lab/ai-llm` | `langchain.invoke` (mock) | 40 ms | provider SLA — same |
| `@kiwa-lab/realtime` | `supabase.channel.track` (mock) | 20 ms | mock-invariant (channel registry lookup + presence Map insert) |
| `@kiwa-lab/realtime` | `ably.channel.publish` (mock) | 20 ms | mock-invariant |
| `@kiwa-lab/realtime` | `pusher.subscribeChannel` (mock) | 20 ms | mock-invariant |
| `@kiwa-lab/realtime` | `socketio.emit` (mock) | 20 ms | mock-invariant |
| `@kiwa-lab/payment` | `signWebhook` (mock) | 10 ms | mock-invariant (HMAC-SHA256 over ~500 bytes is < 1 ms on modern hardware) |
| `@kiwa-lab/payment` | `verifyWebhook` (mock) | 10 ms | mock-invariant |
| `@kiwa-lab/search` | `search` on 20-doc index (mock) | 5 ms | mock-invariant (linear scan over 20 docs) |
| `dogfood-anthropic-chatbot` | `reply` (mock mode) | 30 ms | mock-invariant + one @kiwa-lab/ai-llm call ⇒ threshold matches ai-llm + adapter overhead budget |
| `dogfood-anthropic-chatbot` | `replyStream` (mock mode) | 50 ms | mock-invariant + streaming chunk fan-out (~5 chunks) ⇒ 5 × single-call budget |
| `dogfood-anthropic-chatbot` | `toolLoop` (mock mode) | 100 ms | mock-invariant + tool loop up to 5 iterations |
| `dogfood-openai-tool-agent` | `validateToolSchemas` | 50 ms | mock-invariant (JSON Schema validate over 3 tools) |
| `dogfood-openai-tool-agent` | `runToolLoop` | 100 ms | tool loop up to 5 iterations, matches Anthropic loop budget |
| `dogfood-openai-tool-agent` | `runParallelToolCall` | 100 ms | 2 parallel tools + finaliser turn |
| `dogfood-vercel-ai-rag` | `embed` (mock) | 20 ms | mock-invariant (hashing embedder) |
| `dogfood-vercel-ai-rag` | `retrieve` (mock) | 30 ms | mock-invariant + cosine similarity over ~5 docs |
| `dogfood-vercel-ai-rag` | `answer` (mock) | 100 ms | retrieve + LLM call budget |
| `dogfood-supabase-realtime-chat` | `joinRoom` | 50 ms | Nielsen "instant" — chat presence must feel snappy |
| `dogfood-supabase-realtime-chat` | `sendMessage` | 30 ms | Nielsen "instant" tightened — message send is on the critical hot path |
| `dogfood-supabase-realtime-chat` | `getPresence` | 30 ms | Nielsen "instant" |
| `dogfood-supabase-realtime-chat` | `sendTyping` | 100 ms | typing debounce absorbs 500 ms; single-call p95 has more headroom |
| `dogfood-ably-collab-cursor` | `joinBoard` | 50 ms | Nielsen "instant" |
| `dogfood-ably-collab-cursor` | `moveCursor` | 100 ms | 60 fps throttle window is 16 ms; single call inside the throttle allowed 100 ms because it burst-fires |
| `dogfood-ably-collab-cursor` | `rewindHistory` | 30 ms | in-memory ring buffer scan |
| `dogfood-ably-collab-cursor` | `getPresence` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `subscribeRoom` | 50 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `deliverNotification` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `getPending` | 30 ms | Nielsen "instant" |
| `dogfood-socketio-notification` | `simulateReconnect` | 100 ms | reconnect ceremony (disconnect + queue drain + reconnect) |
| `@kiwa-lab/core` | `parseSpec` | 5 ms | mock-invariant (linear scan over meta lines + one table walk) |
| `@kiwa-lab/core` | `createPool` (size 4) | 5 ms | mock-invariant (Promise.all fan-out over 4 acquires + one borrow/release) |
| `@kiwa-lab/dapp` | `eventEmitterEmit` | 5 ms | mock-invariant (node:events dispatch + listener count) |
| `@kiwa-lab/dapp` | `anvilKeyLookup` | 5 ms | mock-invariant (readonly array indexing) |
| `@kiwa-lab/api` | `requestClientGet` | 5 ms | mock-invariant (url join + Response snapshot with stub fetcher) |
| `@kiwa-lab/api` | `requestClientPost` | 5 ms | mock-invariant (adds JSON.stringify encode over the GET path) |
| `@kiwa-lab/ui` | `setupComponentEnvSnapshot` | 30 ms | jsdom mount + React render + innerHTML capture — the lightest UI test path |
| `@kiwa-lab/ui` | `setupComponentEnvRender` | 30 ms | same jsdom + React mount cost baseline as snapshot |
| `@kiwa-lab/data` | `queueSend` | 5 ms | mock-invariant (dedup Set lookup + array push + consumer notify) |
| `@kiwa-lab/data` | `fakeClockAdvance` | 5 ms | mock-invariant (walk 2-entry cron table + fire due callbacks) |
| `@kiwa-lab/cli-test` | `writeFile` | 20 ms | fs write syscall + relative path resolution over an isolated tempdir |
| `@kiwa-lab/cli-test` | `readFile` | 10 ms | fs read syscall over an isolated tempdir |
| `@kiwa-lab/observability` | `collectRunHistory` | 5 ms | O(N) walk + per-test cap map over 200 records |
| `@kiwa-lab/observability` | `detectFlaky` | 5 ms | O(N) aggregation over 200 records |
| `@kiwa-lab/observability` | `checkThresholds` | 5 ms | mock-invariant (fixed 4-metric compare) |
| `@kiwa-lab/observability` | `renderDashboard` | 5 ms | markdown string concat over a 200-record summary |
| `@kiwa-lab/e2e` | `fetchOverLoopback` | 20 ms | node http server dispatch + fetch-handler adapter over loopback (no network) |
| `@kiwa-lab/cli` | `runSpecToTest` | 20 ms | md read + parseSpec + template render + file write |

## Measurement isolation — the suite runs one package at a time

Root `package.json > scripts.test:perf` runs the workspace pass with `--workspace-concurrency=1`. It must never use `--parallel`.

`--parallel` means "no concurrency limit", so the root script used to start the perf suites of every workspace package that has a `test:perf` script at once — 177 packages (63 under `packages/`, 114 under `examples/`), not the 63 the name suggests. Every measurement then competes for the same cores, and p95 moves with the load of whatever else happened to be running rather than with the code under test. That is the reason the same commit produced different verdicts on consecutive runs, and it makes every downstream mechanism in this file dishonest: the 20 % regression rule compares against a baseline recorded under a different amount of contention, and the concurrent-load target below stops measuring the mock's own shared state.

Dropping `--parallel` alone is not enough. Without it pnpm still defaults to one worker per CPU core, so the numeric limit is written explicitly.

The trade-off is wall-clock time: a serial pass over all 177 packages took 8-22 minutes across the seven passes measured in #1708, against a few minutes when they ran concurrently. That is accepted deliberately — the suite exists to produce comparable numbers, not to finish quickly. `tests/release-smoke/tests/perf-serial-execution.test.ts` fails the release smoke suite if the flag comes back.

## Regression detection defaults

Threshold: **20 % p10 delta** vs stored baseline (`.perf-baseline/{module}.json`), with a bootstrap confidence interval on the p10 difference for significance (CI excluding 0 ⇒ significant).

- baseline is created automatically on the first run (no `--baseline` flag needed since v1.14-post)
- subsequent runs compare against baseline; a > 20 % p10 increase with a significant CI fails the gate
- the p10 difference must also clear an absolute floor derived from the measurement system itself (see below). A relative-only rule gets stricter as the measured value shrinks: 0.03 ms → 0.04 ms is a "significant 33 % regression" on stable samples, yet nothing is actually slower. Ops measured in microseconds would fail on jitter alone.

### Why the verdict reads the bottom of the distribution

Every source of measurement noise — a scheduler preemption, a GC pause, a page-cache miss, another process on the machine — makes a call take **longer**. None make it shorter. So the top of the distribution measures the machine's state on the day, and the bottom measures what the work costs when nothing interferes. Only the second one can be compared across runs.

That is why the p95-based verdict flipped on unchanged code. Measuring the same implementation repeatedly and comparing the two ends:

| op | p95 spread | p10 spread |
|---|---|---|
| `@kiwa-lab/cli-test` `readFile` | 134 % | 6 % |
| `@kiwa-lab/cli-test` `writeFile` | 289 % | 12 % |
| a trivial property read | 18 % | 51 %¹ |
| `JSON.parse(JSON.stringify(…))` | 101 % | 8 % |

¹ The trivial op sits below the harness's own call cost, so both figures are noise around the timer quantum. That case is handled by the floor, not by the statistic.

`min` was rejected in favour of `p10`: a minimum is decided by a single sample, so it is exposed to the timer quantum and to one lucky call. At n = 200, p10 has twenty samples of depth behind it.

Three alternatives from the same measurement round were rejected. **Batching** (making one sample the mean of B calls, with B calibrated so a sample lands near 1 ms) did not converge — `fsWrite` still moved 136 % at the p50 of batched samples, because the per-call cost itself differs between processes. **Median / trimmed mean** of raw samples moved 115-200 % and 147-256 % on the same ops. **Measurement of measurements** (median of five sub-run p95s) moved 210-517 %.

### The absolute floor is measured, not fixed

The floor is no longer the fixed 0.5 ms. Before the ops run, `measureHarnessResolution` times an empty function through the same call path (`async () => { await empty(); }`) and takes its p10. A difference smaller than that is not attributable to the op — it is the harness's own round trip. The floor is set at **twice** that value (`RESOLUTION_FLOOR_MULTIPLE`).

The multiplier is load-bearing. `@kiwa-lab/cache`'s env accessors measure 0.00013 ms, which is *faster* than the empty call's 0.00017 ms. With the floor at exactly the resolution, one of four unchanged runs moved p10 to 0.00033 ms and the 0.0002 ms difference cleared the floor, producing `regressed`. At twice the resolution it does not. The deliberate-slowdown check still passes: injecting three times the baseline p95 into one op produces a 0.0034 ms shift, ten times the floor.

The fixed floor was doing real damage. It made every op with a baseline under 0.5 ms permanently unjudgeable, which was the whole of `cache`, `dapp`, `api`, and `data`. On this machine the measured floor lands near 0.0003 ms, roughly three orders of magnitude lower, so those ops became judgeable for the first time.
- baselines are discarded and reseeded when the measurement premise changes (Node version, platform, CPU, or whether `--expose-gc` was available). Comparing across those boundaries reports regressions that no code change caused. The first valid run under the new premise reseeds; comparison resumes from the run after that. A run that is not itself valid — `requireGc: true` with no GC available, or one that fails a hard cap — leaves the stored baseline untouched, so a broken environment cannot become the new reference.
- to intentionally accept the new baseline (e.g. after a deliberate optimisation regression), delete `.perf-baseline/{module}.json` and rerun

### Where baselines live

All baselines sit in `.perf-baseline/` **at the repo root**, and they are tracked in git.

The path used to be derived from `process.cwd()`, so the same module wrote to `packages/{name}/.perf-baseline/` when invoked through `pnpm --filter`, and to `<root>/.perf-baseline/` when invoked from the repo root. Each invocation only ever read one of the two, decided there was no baseline, and reseeded — so a comparison never happened. The path is now anchored to the nearest ancestor holding `pnpm-workspace.yaml` or `.git`. A standalone consumer of the package outside a repo still falls back to the working directory.

They are tracked because an untracked baseline means the first run on any checkout has nothing to compare against. "Whoever measures first cannot detect a regression" is not a property worth keeping.

That help is limited to machines matching the one that recorded them. `isComparableEnv` requires the same Node version, platform, CPU model and core count, so a different machine gets no comparison on its first run and reseeds locally. **Do not commit that reseed** — it replaces the reference for everyone else with your machine's numbers. The committed set was recorded on a single machine; treat it as that machine's reference, not a portable one. Making the tracked set portable needs per-environment baseline files, which is a separate change.

The machine's hostname is not recorded. It plays no part in the comparison, and a tracked file is the wrong place for it.

### When measurements stop being comparable

`BaselineEnv.measurementPremise` records the version of *how* the measurement is taken, separate from the machine it ran on. A baseline recorded under a different version is not compared against; the next run that is itself valid reseeds it. Version 2 is the serial regime described above — values recorded under the older parallel regime carry the load of ~177 concurrent suites and mean something different. Version 4 adds the resolution measurement that now precedes every suite, which warms the call path before the first op reaches it.

Bump it only when the same implementation would measure differently. Threshold and verdict changes are not measurement changes — the move from p95 to p10 did not by itself require a bump, since it reads the same stored samples.

### What the report shows when no verdict is reached

The regression column distinguishes four cases that would otherwise all render as `stable`:

| what happened | how it renders |
|---|---|
| measured, no meaningful change | `stable` |
| relative rule fired, absolute delta below the floor | `stable (差 …ms が下限 …ms 未満で判定を保留)` |
| baseline is under the floor, so detection needs an outsized change | `stable (検知には +…ms (baseline 比 +…%) 以上の悪化が必要)` |
| the bottom held still and only the tail grew | `stable (下側は動かず p95 のみ +…%)` |

The third case says what it would take, not that detection is impossible — an op that slows by more than the floor is still reported as regressed. Notes are attached only to rows that did *not* reach a verdict; a `regressed` row carries no sensitivity note, because pairing the two reads as a contradiction.

The fourth case is the cost of judging on the bottom of the distribution. A change that makes only *some* calls slower — a rarely-taken branch, an occasional cache miss — does not move p10. `RegressionResult.tailDeltaPct` carries the p95 change so the fact is not lost, but it cannot be gated: on unchanged code that same axis moves by hundreds of percent between runs, so a real tail regression and a busy machine are indistinguishable there.

### The regression verdict is reported but not gated

Regression detection compares two separate runs, so it only works when an op's own run-to-run spread is smaller than the 20 % threshold. Under the p95 verdict **no** op in this set qualified — the spreads started at 134 %. Moving the verdict to p10 brought five of the seventeen inside the bound. That is the honest figure: the set below is not a sample of all ops, it is the collection of ops that were already known to be unstable, so five surviving it is a floor on the improvement, not a ceiling.

Measured across two independent rounds of four consecutive unchanged runs (the second round reseeding its baseline on a machine already warmed by the first, so the reference is representative of how the suite actually runs):

| op | p10 spread | gateable |
|---|---|---|
| `visual-app-scenario` `baseline_compare` | 2-6 % | yes |
| `a11y-app-scenario` `audit_error_handling` | 8-14 % | yes |
| `@kiwa-lab/cli` `runSpecToTest` | 12 % | yes |
| `cli-app-scenario` `spec_to_test_batch` | 16-17 % | yes |
| `visual-app-scenario` `large_image_diff` | 3-18 % | yes |
| `cli-app-scenario` `init_error_handling` | 18-32 % | no |
| `a11y` `runAxeDirtyReport` | 22-24 % | no |
| `cli-app-scenario` `init_workflow` | 21-24 % | no |
| `a11y-app-scenario` `violation_report_batch` | 21-29 % | no |
| `visual` `comparePngBuffersFullDiff` | 17-41 % | no |
| `a11y-app-scenario` `audit_workflow` | 11-44 % | no |
| `cli-test` `readFile` | 60-100 % | no |
| `cli-test-app-scenario` `batch_cli_run` | 42-108 % | no |
| `cli-test-app-scenario` `file_scaffold_workflow` | 35-110 % | no |
| `visual` `comparePngBuffersIdentical` | 49-169 % | no |
| `cli-test-app-scenario` `setup_cleanup_cycle` | 65-244 % | no |
| `cli-test` `writeFile` | 100-322 % | no |

Two ranges are reported per op because the two rounds disagreed, sometimes widely: `audit_workflow` measured 11 % in one and 44 % in the other. **Four runs is not enough to certify an op.** An op qualifies only if it stayed under the threshold in both rounds, which is why `audit_workflow` keeps its waiver despite a passing round. The disagreement tracks when in the sweep a measurement was taken: the first round's baseline was recorded on a machine that had been idle, and everything measured afterwards read systematically slower against it. That is what made the first round's numbers unusable and forced the reseed described above. What in the machine changes over a sweep was not measured here — see the note under § The regression verdict is reported but not gated.

Sample count is not the cause of the residual spread. Raising `serialIterations` from 15-30 to 60-200 across the fourteen affected files changed which packages failed rather than how many, and at the higher counts it exposed ops whose cost grows with iteration count — `a11y`'s `audit_workflow` went from 23 ms to 216 ms, breaching a cap it had passed. That change was reverted.

So `runPerf3Layer` computes the verdict, writes it into the report, and leaves it out of `allPassed` unless the caller passes `regressionGate: true`. Turning the default on requires measuring the remaining packages the same way, which is tracked in #1708.

The caps (serial, concurrent, memory) are still gated. A cap is decided inside a single run and does not depend on run-to-run spread — that is how the `vector` breach in this suite was found.

#### Measured across the whole suite, and why the gate still cannot be switched on

The `@kiwa-lab/cache` measurements above cover one package. The full suite was then measured the same way: one reseeding pass plus six analysis passes over all 177 workspace packages, recording every op's p10 each time. Individual passes ran 8m21s to 19m07s, 79 minutes of measurement inside a 94-minute window — the variation in pass duration is itself part of what the numbers below describe.

`detectRegression` requires three things: the absolute difference clears the floor, the relative change clears 20 %, and the bootstrap CI excludes zero. The counts below apply the first two and assume the third — a deliberate upper bound, since CI significance depends on the sample and cannot be recovered from stored p10 alone. Classified that way over 492 ops:

| passes used | ops that could fail the gate | modules with no such op |
|---|---|---|
| 4 | 190 | 45 (28 with 2× margin) |
| 6 | 217 | 35 (21 with 2× margin) |

The qualifying set shrank as passes were added. That direction is partly mechanical — the classification uses each op's observed extrema, so more passes can only widen them — and on its own it does not establish that the set never settles.

What does carry weight is what happened when the set was used. The gate was enabled for the 28 modules that looked safe over four passes; two verification passes followed, and on the second one three of them (`qwikcity`, `dogfood-postgres-cdc-outbox-app`, `dogfood-vector-search-app`) failed on unchanged code. Their p10 had been flat across passes 2-5 and then drifted upward — `driveIndexBuild` went 0.0015 / 0.0014 / 0.0015 / 0.0015 and then 0.0015 / 0.0023. A selection made from four passes was falsified by the next two. Whether a longer window would produce a stable set is not something these measurements answer either way.

What was recorded is narrow: p10 per op per pass, and nothing else. No temperature, clock, or background-load telemetry, so thermal state, page cache, and scheduler pressure cannot be separated. What the numbers do show is that an op reads flat for four passes and then shifts, and that switching statistic (p95 → p10) moved the spread without removing it — the earlier `cache` experiment ruled out median, trimmed mean, and batching the same way. That is consistent with a drift the whole run inherits rather than something in the shape of the sample, but a drift shared by *every* statistic is an inference from three of them, not a measurement.

That is the same wall the in-run reference normalization was measured against (§ What would make the remaining twelve gateable): comparing an op to a reference measured *in the same run* cancelled the shared drift in that experiment, taking `fsRead` from 141 % to 3 %. It is the only approach measured so far that reduced the drift rather than reframing it, and it changes what a baseline stores (a ratio, not a duration).

Until then `regressionGate` stays false everywhere. Turning it on for a subset is not a safe halfway step: the subset is defined by how long you happened to watch.

Two alternatives were rejected. Relaxing the relative threshold to 50 % hides real regressions on ops with large measured values, and would not be enough anyway (the spreads above reach 322 %). Raising the per-op `minDeltaMs` to the observed spread produces a floor of +12 ms on a 1.4 ms op, which nominally keeps the gate on while guaranteeing it never fires — and unlike an explicit opt-out, nothing in the report says so.

`regressionGateWaived: '<reason>'` marks the twelve ops still above the threshold, so the list survives until the gate can be switched on for them. The reason string carries the measured spread. Adding one requires measured evidence; do not add one because a run happened to fail. Every row marked `no` above carries a waiver — a row that is not gateable and not waived would fail the gate the moment `regressionGate` is turned on.

### What would make the remaining twelve gateable

Four statistics were tried over a single run's samples — p95, p10, median, trimmed mean — and none of them removed the spread; it tracks when the measurement was taken. What did reduce it, measured: comparing the op against a **reference op measured in the same run**, alternating call by call.

| op | raw p10 spread | ratio to a CPU-only reference | ratio to an fs reference |
|---|---|---|---|
| `fsRead` | 141 % | 88 % | **3 %** |
| `fsWrite` | 43 % | 34 % | **13 %** |

The reference has to share the disturbance: a CPU-bound reference does not help an fs-bound op, and its own measurement moved 2406 % across runs, making it useless as a denominator for anything. So each op would have to declare a reference of the right kind, and every stored baseline would become a ratio rather than a duration. That is a change to what a baseline *is*, not to which statistic is read from it, and is left to a follow-up.

### An `a11y` cap breach that no longer reproduces

`a11y`'s `audit_error_handling` was recorded breaching its 100 ms cap intermittently — 195 / 163 / 145 / 17.6 / 17.3 ms across five runs, a tail ten times the usual value — and `audit_workflow` was recorded between 23 ms and 394 ms (#1728). Three explanations were proposed: jsdom accumulating across iterations, axe-core taking a slow path on invalid input, or a GC pause landing inside the measured window.

None of that reproduces now. Five consecutive runs on the current configuration give `audit_error_handling` a p95 of 14.4-26.2 ms against its 100 ms cap, and `audit_workflow` 23.8-42.0 ms, with the same gate verdict every time.

What the investigation did establish is narrow, and worth stating precisely because the gap between it and "we found the cause" is where the temptation lies.

Sample positions do not support accumulation across iterations: the slowest iterations land at 10 / 8 / 0 / 1 / 11 out of 20, scattered rather than weighted toward the end. That is evidence against the first candidate.

The other two were not tested. Axe-core's path selection and GC activity were never instrumented, so "the slow path" and "a GC pause" remain open — and neither is exclusive with load, so a breach under contention could still have been either of them.

Parallelism was the initial hypothesis and it did not hold up. The runs that recorded the outliers sit downstream of the serialization commits, so the tree at that point already had `--workspace-concurrency=1` and `fileParallelism: false`; the older 177-suite configuration cannot have been in effect unless the runner was overridden, and no record of that survives. Re-enabling `fileParallelism` for `a11y` alone was then tried as a controlled comparison and produced 23 / 44 / 42 ms for `audit_workflow` — inside the 23.8-42.0 ms the serial configuration produces anyway. The ranges overlap, so the experiment separates nothing.

So the honest position is that a breach was observed, is not reproducible today, and has no identified cause. It is recorded rather than closed as fixed, because a tail that appears only under some condition looks identical in the samples to a tail intrinsic to the code — and an unreproducible breach is the case where that ambiguity is hardest to resolve. If it returns, instrument axe-core's path and GC before reaching for an explanation.

### The first run after a rebuild can breach a cap

The suite rebuilds `@kiwa-lab/perf-harness` before each package's perf run, so the first pass after a code change starts cold. On jsdom-heavy ops that shows up in the concurrent axis: `a11y`'s `runAxeDirtyReport` breached its 800 ms cap on a first pass and measured 117 ms on the next one, unchanged. The two warmup rounds the concurrent layer performs do not cover the JIT and jsdom setup cost at that scale.

Treat a cap breach on a first pass as unconfirmed. Re-run the package before acting on it; a real breach reproduces. The `vector` breach fixed in #1708 reproduced on every pass, which is how it was distinguished from this.

## Real-API measurement mode

Live-mode perf tests coexist with mock perf tests under `tests/perf/`. The `*.live.perf.ts` files use `runPerf3LayerLive` from `@kiwa-lab/perf-harness` and declare their required env vars via the `requiredEnv` option. Missing env vars trigger the skip path — the run still emits a report, but with `LIVE_ENV_MISSING` markers instead of gate results. This keeps CI-less environments honest: an empty report row is attributed to missing credentials, not silent success.

Enable live mode by setting the required env vars and rerunning the perf suite:

```bash
# Live mode for one provider
export ANTHROPIC_API_KEY=sk-ant-...
pnpm --filter dogfood-anthropic-chatbot test:perf
# Mock 3-layer runs alongside; live 3-layer runs against the real API

# All 6 dogfood live envs
export ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... \
  SUPABASE_URL=https://... SUPABASE_ANON_KEY=... \
  ABLY_API_KEY=... SOCKETIO_URL=https://... \
  RAG_VECTOR_STORE_URL=https://... RAG_VECTOR_STORE_API_KEY=...
pnpm -r --workspace-concurrency=1 run test:perf --if-present
```

Live iteration count defaults to 10 (vs 200 for mock) — live calls cost money and are slow, so a full pass fits in a coffee break. Concurrency defaults to 3 to avoid rate-limiting.

Live thresholds are provider-SLA sourced — not mock-invariant — and sit at the provider's own p95 target:

| provider | live p95 threshold | source |
|---|---|---|
| Anthropic Messages (non-streaming) | 1500 ms | Anthropic status page + latency dashboards |
| OpenAI Chat Completions (non-streaming, gpt-4o) | 1500 ms | OpenAI status page |
| Supabase Realtime publish | 250 ms | Supabase Realtime WebSocket round-trip target |
| Ably publish (round-trip) | 200 ms | Ably SLA — 99.999 % delivery within 200 ms |
| Socket.io emit (loopback) | 100 ms | in-cluster network + Redis adapter round-trip |

## Concurrent load target

Every mock target has a serial baseline (concurrency = 1) and a concurrent stress run (concurrency = 10, iterations per worker = 50 ⇒ 500 samples). The concurrent p95 threshold is **2 × the serial threshold** — mocks share in-memory state (engines, recorders), so some contention is expected but > 2 × means the shared state is a bottleneck.

## Memory delta target

Every mock op is checked for growth in retained `ArrayBuffer` backing stores. Threshold: **< 100 KB retained across 200 iterations** (i.e. < 500 bytes / call on average). Ordinary JS-heap retention — an unbounded Map, array, or listener list — is **not** gated; `heapUsed` is reported alongside it but nothing is compared against it. Why, and at what cost, is below.

The measured window is preceded by a warmup (a tenth of the iteration count, minimum 3). Without it the first call's one-off allocations land in the delta and get divided by the iteration count as if they recurred. Node grows its Buffer pool in 8 KB steps, so an fs-touching op showed 24 KB of "retention" over 15 iterations that dropped to 0 B once the pool had settled.

Measuring memory at all requires `--expose-gc`. Without it `measureMemory` cannot call `global.gc()`, so the delta includes allocations that were about to be released, and the comparison against a cap is not a comparison of retention. 117 of the 180 perf configs were missing it. `dogfood-nats-jetstream`'s `driveObject` reported 215,800 B against a 100 KB cap — reproducibly, to the byte, on every run — and 20,555 B once GC was available. The breach was an artefact of the measurement.

Three things have to be present together. `--expose-gc` in `execArgv`, `pool: 'forks'`, and `requireGc: true` on the call. `worker_threads` silently ignores `execArgv`, so a config that sets the flag under the default pool looks configured and measures without GC. And a call that does not ask for GC will accept a run without it — the config only makes GC *available*, `requireGc` is what makes its absence a failure. 34 example suites were passing `runPerf3Layer` without it, so a run under a different config would have reported memory numbers that mean nothing and still passed. `tests/release-smoke/tests/perf-gate-coverage.test.ts` checks all three.

### The axis sees only half of what it should, and the other half has no usable channel

`arrayBuffers` counts `ArrayBuffer` backing stores. Anything backed by one moves it; anything living purely on the JS heap does not.

The figures below come from a standalone script, not from this repo's suites: Node v24.15.0 with `--expose-gc`, 3 warmup iterations then 15 measured, `global.gc()` before and after, retaining 10 KB per iteration into an array that stays reachable. The `arrayBuffers` column is the load-bearing one and is stable across runs; the `heapUsed` column varies (see below) and is shown only to make the split visible.

| what is retained | `heapUsed` | `arrayBuffers` |
|---|---|---|
| nothing | 22,080 B | 0 B |
| a `Buffer` | 1,336 B | 153,600 B — caught |
| an `ArrayBuffer` | 2,440 B | 153,600 B — caught |
| a `Uint8Array` | 4,048 B | 153,600 B — caught |
| a JS array of numbers | 156,552 B | 0 B — **passes the gate** |
| entries in a `Map` | 161,736 B | 0 B — **passes the gate** |

So the gate covers the whole `ArrayBuffer` family and is blind to ordinary JS-heap retention — which is the shape most "unbounded internal Map" bugs actually take. `tests/three-layer-strict.test.ts` pins that blindness with an explicit assertion rather than leaving it implied.

Adding `heapUsed` as a second axis was the obvious fix and it does not work. The two sweeps recorded in this repo (the `docs/quality-reports/perf/**` state at `HEAD^` and at `HEAD`, both on unchanged code) differ by more than the entire 100 KB cap on **41 of 492 ops** — median movement 1,632 B, mean 24,901 B, max 474,016 B. More directly: **18 ops sit on opposite sides of the cap in the two sweeps**, so a gate reading `heapUsed` would have produced a different verdict for each of them without a line of code changing.

Gating on that would fail ops at random. It is the same failure the `arrayBuffers` axis already has on fs-heavy work, in a different place.

The instability is not confined to long sweeps. A single unit test that retained 10 KB per iteration and asserted `heapUsedDeltaBytes > 100 KB` failed 2 runs out of 5, reporting **-4,071,968 B** on the failures — a large negative delta, because the forced GC after the measured window collected objects allocated before it. The assertion was removed; a test that depends on `heapUsed` inherits exactly the property that disqualifies it from the gate.

Measured on its own the picture looks fine — eight consecutive standalone runs of an fs workload gave `heapUsed` 22,080 B every time, identical to the byte. That reading is what made the two-axis change look correct at first. It only breaks under the full sweep, which is the condition the gate actually runs in. **Standalone stability is not evidence about a gate that runs inside a 90-minute sweep.**

Two other candidates were rejected without needing a full measurement. Ignoring differences under Node's 8 KB pool granularity would quiet the `arrayBuffers` noise but leave an 8 KB-per-iteration `Buffer` leak invisible. Raising the iteration count until the pool saturates makes every measurement slower without addressing either the blindness or the drift.

Five ops exceeded the cap on `heapUsed` in both recorded sweeps. Raw bytes, `HEAD^` then `HEAD`:

| op | sweep 1 | sweep 2 |
|---|---|---|
| `ui-app-scenario` `mount_error_handling` | 4,477,744 B | 4,475,712 B |
| `visual-app-scenario` `burst_compare` | 478,368 B | 477,352 B |
| `vector-app-scenario` `batch_upsert_1000` | 267,296 B | 267,392 B |
| `e2e` `fetchOverLoopback` | 216,368 B | 215,592 B |
| `chart` `renderChart` | 203,168 B | 199,640 B |

Two observations do not separate retained application state from a repeatable runtime or allocator effect, so this is a list of candidates rather than a finding. None are gated today.

The axis therefore stays as it is: `arrayBuffers` only, with `memoryGateWaived` for the fs-heavy ops where even that is decided by the allocator. What would replace it needs a channel that is both complete and stable under load, and neither of the two Node exposes is.

`crypto`'s `ed25519_batch` shows the same axis reacting to load rather than to code. Run on its own it reports 0 B three times in a row; during one full-suite sweep it reported 168,960 B against a 100 KB cap, and the next sweep put it back at 0 B. It carries no waiver — a single non-reproducing breach is not evidence about the op — but it is worth recording that the axis moves with what else is running, which is the same reason the ops below carry one.

The same shape appears at a larger scale in `visual`'s `comparePngBuffersFullDiff`. Running `pnpm --filter @kiwa-lab/visual test:perf` four times with no code change and reading the `arrayBuffers` column of `docs/quality-reports/perf/visual.md` after each gives roughly +10.5 MB / -6.0 MB / +13.7 MB / +0.8 MB, and a separate full-suite pass recorded +20.1 MB. A spread wider than the 16.7 MB cap means the verdict is decided by allocator behaviour rather than by the library, and it failed at least one full-suite pass on unchanged code. It carries a waiver rather than a raised cap for the reason above. (The per-pass memory numbers are not in the stored sweep artifacts — those hold p10 only — so the figures above are reproduced by re-running the command, not read back from a log.)

## Change control

If a threshold in the table changes, the PR body must document:

1. Which threshold changed and by how much
2. Which of the 3 rationales (provider SLA / human perception / mock-invariant) still applies
3. If none apply, a new rationale row must be added to this file

The rules/quality.md § test-passed marker gate forwards to this doc for perf assertions.
