1/ kiwa v1.25 リリース — Perf-harness sweep milestone。 v1.13-1 で land した `@kiwa/perf-harness` v0.1 (`measure` p50/p95/p99 + `saveBaseline` + `detectRegression` + `evaluatePerfGate` primitive) + v1.14-post で land した `runPerf3Layer` (serial + concurrent + memory 3-layer harness) を基盤に、 v1.25 は同 primitive を **33 全 kiwa package** に rollout、 3 warmup + 100 iteration + 20 % p95 delta + Welch's t-test |t| > 2 の SSOT で統一。 33 package sweep + v0.2 minor bump。

2/ なぜ 33 package coverage? 3-pilot rollout には 3 失敗 mode がある — threshold drift (package A = p50 < 5 ms / package B = p95 < 10 ms / package C = mean < 8 ms、 regression 発火の意味が package で違う)、 iteration count drift (10 iter は warmup noise / 10 000 iter は 10 s × 33 pkg CI 負荷)、 regression detection drift (5 % / 10 % / 30 % が全部「regression」 と呼ばれる)。 4 rule SSOT (`docs/concepts/perf-testing-ssot.md`) = 3 warmup + 100 iter / Welch's t-test |t| > 2 / 20 % p95 delta / baseline JSON schema は package 越し・ milestone 越し・ fork 越しで perf 比較可能にする最小 set。

3/ v1.25-1 core layer perf sweep — 9 package (`@kiwa/core` / `dapp` / `api` / `ui` / `data` / `cli-test` / `observability` / `e2e` / `cli`) に `tests/perf/{package}.perf.ts` + `test:perf` script + `.perf-baseline/{package}.json` 追加。 各 suite は `runPerf3Layer` (serial concurrency=1 200 iter + concurrent concurrency=10 500 iter + memory heap sampling) 経由。

4/ v1.25-2 framework adapter perf sweep — 11 framework adapter (`a11y` / `visual` / `nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `fresh` / `hono` / `solidjs`) に同 pattern。 framework baseline path 分離で cross-adapter noise 抑制。

5/ v1.25-3 test type perf sweep — 3 test type package (`a11y` / `visual` / `component`) + 3-layer perf harness。

6/ v1.25-4 SaaS layer perf sweep — 10 SaaS layer package (`auth` / `queue` / `cache` / `orm` / `payment` / `streaming` / `search` / `mcp` / `agent` / `ai-llm`) + provider 別 baseline + `KIWA_MODE=real` opt-in で real sandbox 走査。

7/ v1.25-5 release-gate 統合 + docs — `perf.p95Ms` axis を 11-axis release gate に統合。 2 tutorial (45 perf-harness baseline + 46 perf baseline migration) + concept doc `perf-testing-ssot.md` 4 rule SSOT + migration guide v1.24 → v1.25 (additive-only) + snippet validation `docs-tutorial-v1.25.test.ts` (15 test)。

8/ v1.25-6 publish — `@kiwa/perf-harness` v0.1.1 → v0.2.0 minor bump を npm publish。 additive-only ... v0.1 signature 完全維持。 VitePress sidebar に `Perf-harness sweep (v1.25)` tutorial section + `perf-testing-ssot.md` (Concepts) + `v1.24 → v1.25` (Migrations) 追加。 gh-pages publish。 release script filter に `@kiwa/perf-harness` 追加 (v1.14 payment 漏れ再発防止)。 Roadmap ... https://github.com/cardene777/kiwa#roadmap — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 → v1.18 → v1.19 → v1.20 → v1.21 → v1.22 → v1.23 → v1.24 → v1.25 の 15 milestone 連続完遂。
