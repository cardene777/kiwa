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

The trade-off is wall-clock time: a serial pass takes roughly 20-40 minutes instead of a few minutes. That is accepted deliberately — the suite exists to produce comparable numbers, not to finish quickly. `tests/release-smoke/tests/perf-serial-execution.test.ts` fails the release smoke suite if the flag comes back.

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

Two ranges are reported per op because the two rounds disagreed, sometimes widely: `audit_workflow` measured 11 % in one and 44 % in the other. **Four runs is not enough to certify an op.** An op qualifies only if it stayed under the threshold in both rounds, which is why `audit_workflow` keeps its waiver despite a passing round. The disagreement itself has a physical cause — the machine runs slower when hot, and a suite that takes 20-40 minutes spends most of that time hot — so a baseline recorded on a cold machine reports systematic regressions afterwards. That is what made the first round's numbers unusable and forced the reseed described above.

Sample count is not the cause of the residual spread. Raising `serialIterations` from 15-30 to 60-200 across the fourteen affected files changed which packages failed rather than how many, and at the higher counts it exposed ops whose cost grows with iteration count — `a11y`'s `audit_workflow` went from 23 ms to 216 ms, breaching a cap it had passed. That change was reverted.

So `runPerf3Layer` computes the verdict, writes it into the report, and leaves it out of `allPassed` unless the caller passes `regressionGate: true`. Turning the default on requires measuring the remaining packages the same way, which is tracked in #1708.

The caps (serial, concurrent, memory) are still gated. A cap is decided inside a single run and does not depend on run-to-run spread — that is how the `vector` breach in this suite was found.

Two alternatives were rejected. Relaxing the relative threshold to 50 % hides real regressions on ops with large measured values, and would not be enough anyway (the spreads above reach 322 %). Raising the per-op `minDeltaMs` to the observed spread produces a floor of +12 ms on a 1.4 ms op, which nominally keeps the gate on while guaranteeing it never fires — and unlike an explicit opt-out, nothing in the report says so.

`regressionGateWaived: '<reason>'` marks the twelve ops still above the threshold, so the list survives until the gate can be switched on for them. The reason string carries the measured spread. Adding one requires measured evidence; do not add one because a run happened to fail. Every row marked `no` above carries a waiver — a row that is not gateable and not waived would fail the gate the moment `regressionGate` is turned on.

### What would make the remaining twelve gateable

The residual spread is environmental — thermal state, page cache, subprocess spawn cost — and no choice of statistic over a single run's samples removes it. What does remove it, measured: comparing the op against a **reference op measured in the same run**, alternating call by call.

| op | raw p10 spread | ratio to a CPU-only reference | ratio to an fs reference |
|---|---|---|---|
| `fsRead` | 141 % | 88 % | **3 %** |
| `fsWrite` | 43 % | 34 % | **13 %** |

The reference has to share the disturbance: a CPU-bound reference does not help an fs-bound op, and its own measurement moved 2406 % across runs, making it useless as a denominator for anything. So each op would have to declare a reference of the right kind, and every stored baseline would become a ratio rather than a duration. That is a change to what a baseline *is*, not to which statistic is read from it, and is left to a follow-up.

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

Every mock op is checked for retained-heap growth. Threshold: **< 100 KB retained across 200 iterations** (i.e. < 500 bytes / call on average). Anything higher signals an unbounded internal Map / array / listener list.

The measured window is preceded by a warmup (a tenth of the iteration count, minimum 3). Without it the first call's one-off allocations land in the delta and get divided by the iteration count as if they recurred. Node grows its Buffer pool in 8 KB steps, so an fs-touching op showed 24 KB of "retention" over 15 iterations that dropped to 0 B once the pool had settled.

The `arrayBuffers` axis is not trustworthy for fs-heavy ops even with the warmup. Measured repeatedly with no code change, one such op reported 118-199 KB against a 100 KB cap while its two neighbours swung between +49 KB and -19 KB. The spread is the same size as the cap, so the verdict is decided by allocator behaviour rather than by the library. Those ops carry `memoryGateWaived: '<reason>'`, which prints `WAIVED (reason)` instead of `PASS` so the row cannot be mistaken for a measurement that passed. Rebuilding the axis is tracked separately.

## Change control

If a threshold in the table changes, the PR body must document:

1. Which threshold changed and by how much
2. Which of the 3 rationales (provider SLA / human perception / mock-invariant) still applies
3. If none apply, a new rationale row must be added to this file

The rules/quality.md § test-passed marker gate forwards to this doc for perf assertions.
