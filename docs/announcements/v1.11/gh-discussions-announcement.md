# 🌱 kiwa v1.11 — quality gate 補強 (5 軸統一 harness + dogfood 3 app + docs 3 pillars + GitHub Pages、 6 sub 全 resolved)

The v1.11 milestone (**6/6 GitHub Issues resolved**) just landed. After v1.10 shipped 3 axes of provider expansion (Supabase Auth + RabbitMQ + Rust contract layer)、 v1.11 shifts kiwa's focus from **"add more providers"** to **"measure release quality with numbers"**. Every provider now reports the same 5-axis score、 the release gate has SSOT thresholds、 3 dogfood apps run real-vs-mock behavioural fidelity checks、 and the whole docs site publishes to GitHub Pages via CI-free `/docs-publish` local skill.

## 1. `@kiwa/quality-metrics` v0.1 — 5-axis unified score

Every kiwa provider adapter now emits the same shape. The harness collects coverage / test count / fidelity / perf p95 / mutation kill rate、 evaluates against release-gate thresholds、 and emits markdown + JSON reports.

```ts
import {
  assembleReport,
  coverageFromV8Summary,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
} from "@kiwa/quality-metrics";

const report = assembleReport({
  provider: "@kiwa/auth",
  version: "0.3.0",
  coverage: coverageFromV8Summary(coverageSummary.total),
  testCount: testCountFromCategories({ behavior: 236, integration: 8, e2e: 0 }),
  fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 42, realTotalMethods: 60 }),
  perf: perfFromSamples(latencyMs),
  mutation: mutationFromCounts({ mutations: 200, killed: 130 }),
});

const verdict = evaluateReleaseGate(report);
if (!verdict.passed) console.error("blockers:", verdict.blockers);
console.log(emitMarkdown({ report, verdict }));
```

- **7 default thresholds** — line 85% / branch 80% / function 90% / fidelity ratio 70% / perf p95 ≤ 100ms / mutation kill 60% / behavior tests ≥ 10
- **SSOT** at [`docs/quality/release-gate.md`](https://github.com/cardene777/kiwa/blob/main/docs/quality/release-gate.md)
- **44 unit tests + 8 PoC tests** validate the harness end to end

## 2. Dogfood app 3 種 — real-vs-mock behavioural fidelity

Every v1.10 provider now has an example app that runs against the real service AND the kiwa mock. Trace differences feed the fidelity axis of the release gate.

- **`examples/dogfood-supabase-saas-app/`** (v1.11-2) — Next.js-style handlers for email/password + magic link + OAuth PKCE + MFA + SSO SAML + Web3 SIWE + RLS-protected docs
- **`examples/dogfood-rabbitmq-worker-app/`** (v1.11-3) — order-processing worker with DLX + delayed message + 3-node quorum failover + federation ingest + auto-reconnect
- **`examples/dogfood-foundry-dapp/`** (v1.11-4) — Solidity ERC20 driven from Rust through `contract::foundry` + `contract::alloy`

All three follow the same **provider-neutral adapter interface + `KIWA_MODE=real|mock` split + trace-diffing fidelity harness** template. The Rust dogfood proves the pattern lands across languages.

**Real-world discovery from v1.11-3:** the release gate FAILED with `perf.p95Ms = 548ms` (threshold 100ms) — proof that the SSOT thresholds have teeth, not just paperwork.

## 3. Docs補強 — 3 pillars (tutorials + migrations + API reference)

- **[`docs/tutorials/`](https://github.com/cardene777/kiwa/tree/main/docs/tutorials)** — 5 self-contained tutorials with a fixed 5-section template (What you'll build / Prerequisites / Step-by-step / Explanation / Troubleshoot)
- **[`docs/migrations/`](https://github.com/cardene777/kiwa/tree/main/docs/migrations)** — v1.9→v1.10 + v1.10→v1.11 additive-only migration guides
- **`docs/api/`** — typedoc + cargo doc + forge doc placeholders + the local `/docs-generate` skill that regenerates the whole tree

Every tutorial pastes directly into an empty repo and runs. No `...` placeholders、 no "install dependencies as needed".

## 4. VitePress + GitHub Pages — CI-free publication

`docs/.vitepress/config.ts` builds the whole site — tutorials + migrations + quality reports + release gate SSOT + API references — into a single navigable + searchable static site. The `/docs-publish-kiwa` skill runs `pnpm docs:build`、 places the output in a `git worktree` on the `gh-pages` branch、 and pushes to `https://cardene777.github.io/kiwa/`. **Zero GitHub Actions**、 in line with kiwa's CI-free rule (`rules/git-workflow.md`).

A Playwright E2E suite (`tests/docs-site-e2e/`) verifies the 5 canonical pages + the search widget after every build.

## Migration

v1.10 users can adopt v1.11 without touching existing tests. Add the harness to your test suite:

```bash
pnpm add -D @kiwa/quality-metrics
```

Full migration guide: [v1.10 → v1.11](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.10-to-v1.11.md).

Sub-Issue AC verification: [#680](https://github.com/cardene777/kiwa/issues/680) (parent) → [#681](https://github.com/cardene777/kiwa/issues/681) [#682](https://github.com/cardene777/kiwa/issues/682) [#683](https://github.com/cardene777/kiwa/issues/683) [#684](https://github.com/cardene777/kiwa/issues/684) [#685](https://github.com/cardene777/kiwa/issues/685) [#686](https://github.com/cardene777/kiwa/issues/686).

Happy testing! 🌱
