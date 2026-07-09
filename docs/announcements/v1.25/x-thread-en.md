1/ kiwa v1.25 is out — Perf-harness sweep milestone. After v1.13-1's `@kiwa-lab/perf-harness` v0.1 landed the `measure` p50/p95/p99 + `saveBaseline` + `detectRegression` + `evaluatePerfGate` primitives and v1.14-post added `runPerf3Layer` (serial + concurrent + memory 3-layer harness), v1.25 rolls the same primitives out to **all 33 kiwa packages** under one shared SSOT (3 warmup + 100 iteration + 20 % p95 delta + Welch's t-test |t| > 2). 33 package sweep + v0.2 minor bump.

2/ Why 33 package coverage? A 3-pilot rollout has 3 failure modes — threshold drift (p50 < 5 ms vs p95 < 10 ms vs mean < 8 ms), iteration count drift (10 iter = warmup-noise, 10 000 iter = 10 s × 33 pkg CI hit), regression detection drift (5 % vs 10 % vs 30 % all called "regression"). The 4-rule SSOT (`docs/concepts/perf-testing-ssot.md`) — 3 warmup + 100 iter / Welch's t-test |t| > 2 / 20 % p95 delta / baseline JSON schema — is the smallest set that makes kiwa perf suites comparable across packages, milestones, and forks.

3/ v1.25-1 core layer perf sweep — 9 package (`@kiwa-lab/core` / `dapp` / `api` / `ui` / `data` / `cli-test` / `observability` / `e2e` / `cli`) each grew `tests/perf/{package}.perf.ts` + `test:perf` script + `.perf-baseline/{package}.json`. Every suite uses `runPerf3Layer` (serial concurrency=1 200 iter + concurrent concurrency=10 500 iter + memory heap sampling).

4/ v1.25-2 framework adapter perf sweep — 11 framework adapter (`a11y` / `visual` / `nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `fresh` / `hono` / `solidjs`) same pattern. Framework baseline path separation prevents cross-adapter noise.

5/ v1.25-3 test type perf sweep — 3 test type package (`a11y` / `visual` / `component`) + 3-layer perf harness.

6/ v1.25-4 SaaS layer perf sweep — 10 SaaS layer package (`auth` / `queue` / `cache` / `orm` / `payment` / `streaming` / `search` / `mcp` / `agent` / `ai-llm`) + provider 別 baseline + `KIWA_MODE=real` opt-in for real sandbox measurement.

7/ v1.25-5 release-gate 統合 + docs — `perf.p95Ms` axis integrated with 11-axis release gate. 2 tutorials (45 perf-harness baseline + 46 perf baseline migration) + concept doc `perf-testing-ssot.md` 4-rule SSOT + migration guide v1.24 → v1.25 (additive-only) + snippet validation `docs-tutorial-v1.25.test.ts` (15 test).

8/ v1.25-6 publish — `@kiwa-lab/perf-harness` v0.1.1 → v0.2.0 minor bump published to npm. Additive-only: v0.1 signature completely preserved. VitePress sidebar gains `Perf-harness sweep (v1.25)` tutorial section + `perf-testing-ssot.md` under Concepts + `v1.24 → v1.25` under Migrations. gh-pages published. release script filter に `@kiwa-lab/perf-harness` 追加 (v1.14 payment 漏れ再発防止). Roadmap: https://github.com/cardene777/kiwa#roadmap — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 → v1.18 → v1.19 → v1.20 → v1.21 → v1.22 → v1.23 → v1.24 → v1.25: 15 milestones in a row.
