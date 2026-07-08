---
title: "kiwa v1.27 released — Mutation testing sweep (Stryker rollout + 4-tier threshold SSOT + 12-axis release gate)"
emoji: "🧬"
type: "tech"
topics: ["oss", "typescript", "mutation-testing", "stryker", "kiwa"]
published: true
---

# kiwa v1.27 released

v1.27 は kiwa の 17 milestone 目です。 v1.11 (release gate、 `@kiwa/quality-metrics` v0.1 で `mutationFromCounts` + 60 % kill-rate axis on 11-axis release gate を land) を基盤に、 v1.27 は同 primitive の上に **4-tier mutation threshold SSOT + Stryker 33 全 kiwa package rollout + 12-axis release gate 拡張 (mutation.tier axis 追加)** を land。 v0.2 primitive (`assembleReport` / `evaluateReleaseGate` / `mutationFromCounts` / `emitMarkdown`) は first-line contract のまま維持 (v0.2 signature 完全維持)、 5 新 primitive (`DEFAULT_MUTATION_TIER_THRESHOLDS` / `resolveMutationTier` / `assertMutationTier` / `MutationTier` type / `ReleaseGateContext` type) は second-line envelope として並走。 `@kiwa/quality-metrics` v0.2.0 → v0.3.0 minor bump は 4-tier threshold SSOT extension + 12-axis release gate 標準化を反映。 v1.11 以降の連続完遂 16 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化 → Edge / Serverless 深化 → Perf-harness sweep → Database 深化) を受けて、 v1.27 は Mutation testing sweep milestone、 kiwa runtime fixture 34 packages はそのまま維持 (quality-metrics 既存 package の minor 拡張)。

## 主な追加

### `@kiwa/quality-metrics` v0.3.0 (4-tier mutation threshold SSOT + tier-aware 12-axis release gate extension)

v1.11 で land した `assembleReport` + `evaluateReleaseGate` + `mutationFromCounts` + `emitMarkdown` + 全 `*Metric` type alias の signature を完全維持したまま、 v1.27 は `packages/quality-metrics/src/gate.ts` に 5 primitive を追加。 全 primitive は pure function (no adapter / no network) で決定論的、 test / fixture / release gate で reproducible。

- `DEFAULT_MUTATION_TIER_THRESHOLDS` — 4 tier floor table (Core 80 % / Framework 70 % / SaaS 65 % / Test type 60 %)
- `resolveMutationTier(packageName, packageTierMap)` — package 名から tier を解決 (`PACKAGE_TIER` map 経由)
- `assertMutationTier(report, packageName, tier?)` — tier floor 未達で `MutationTierBelowFloor` error を throw、 offending tier + package + rate + floor を carry
- `MutationTier` type — `'Core' | 'Framework' | 'SaaS' | 'TestType'` の union
- `ReleaseGateContext` type — `evaluateReleaseGate(report, thresholdOverrides, ctx)` 第 3 引数 に渡す context (`mutationTier?: MutationTier` field)

### 4 rule SSOT

`docs/concepts/mutation-testing-ssot.md` は kiwa mutation 全 threshold の 4 rule を単一 SSOT 化。

1. **kill rate = `killed / (killed + survived + timeout + error)`** — Stryker が exposed する 4 個の異なる score (`total MSI` / `covered MSI` / `killed / mutations` / `killed / (killed + survived)`) のうち、 `no-coverage` mutant を分母から除外する formula を採用。 test suite が触れない行の inflation を排除、 `timeout` / `error` mutant の silent reward を排除。
2. **4 tier floor は code の shape で pin** — Core (pure primitive that everything imports、 80 % floor) / Framework (adapter shell that translates to a framework、 70 % floor) / SaaS (provider mock that swaps in for real APIs、 65 % floor) / Test type (test-runner helper、 60 % floor) の 4 tier。 各 downstream config は tier を「code の shape」 で選ぶ、 「historic score を flatter する tier」 は選ばない。
3. **baseline persistence at `.mutation-baseline/{package}.json`** — 5 field JSON schema (`package` / `tier` / `killRate` / `survivedIds` / `runAt`) で全 package が同 shape。 git track で future PR の regression diff が code diff と並んで visible。 baseline rebuild-on-every-run は禁止 (regression が silent に hide される)。
4. **tier-aware 12-axis release gate** — `evaluateReleaseGate(report, thresholdOverrides, { mutationTier })` で 12th axis (`mutation.tier`) を opt-in。 既存 7 / 11 axis caller は `mutationTier` 未指定なら unchanged (v0.2 API 完全維持)。

### v1.27-1 Stryker infra 基盤 (Issue #957)

`@kiwa/*` 34 package (含 quality-metrics itself) に以下 4 経路を land。

- 各 package に `stryker.config.mjs` — `@stryker-mutator/vitest-runner` + `mutate: ['src/**/*.ts']` + `thresholds: { high: <tier-floor>, low: <tier-floor - 10>, break: <tier-floor - 20> }` (`high` / `low` / `break` は tier 依存、 `resolveMutationTier` 経由で解決)
- `test:mutation` script — `stryker run` を wrap、 `--incremental` は default off (regression detection 用に full run)
- `.stryker-tmp/` gitignore — Stryker が生成する intermediate mutant を git track から除外
- `.mutation-baseline/{package}.json` persistence — 5 field JSON schema で全 package baseline を git track

4 tier threshold rationale SSOT は `docs/quality/mutation-thresholds.md` に確立、 4 tier × 各 tier justification (why 80 for Core, why 70 for Framework, why 65 for SaaS, why 60 for Test type) を SSOT 化。

### v1.27-2 core + framework layer mutation sweep (Issue #963)

20 package (9 core layer + 11 framework adapter) に mutation kill rate baseline を確立。

**core layer (9 package)** — `core` / `dapp` / `api` / `ui` / `data` / `cli-test` / `observability` / `e2e` / `cli`。 全 `Core` tier (80 % floor)、 pure primitive that everything imports、 mutation kill rate は必然的に高。

**framework adapter (11 package)** — `a11y` / `visual` / `nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `fresh` / `hono` / `solidjs`。 全 `Framework` tier (70 % floor)、 adapter shell that translates to a framework、 framework 側の behavior に依存する部分は mock で置換不能。

**3-layer harness** — `packages/{package}/src/**/*.ts` を Stryker が mutant 生成、 `packages/{package}/tests/**/*.ts` を Stryker が既存 test として実行、 `packages/{package}/.mutation-baseline/{package}.json` に kill rate を persist。 3 layer は SSOT 化、 downstream package は同 pattern で自動追加可能。

### v1.27-3 test type + SaaS layer mutation sweep (Issue #966)

13 package (3 test type + 10 SaaS layer) に mutation kill rate baseline を確立。

**test type (3 package)** — `a11y` / `visual` / `component`。 全 `TestType` tier (60 % floor)、 test-runner helper、 assertion path の kill rate は relatively low (assertion helpers has less branch coverage)。

**SaaS layer (10 package)** — `auth` / `queue` / `cache` / `orm` / `payment` / `streaming` / `search` / `mcp` / `agent` / `realtime`。 全 `SaaS` tier (65 % floor)、 provider mock that swaps in for real APIs、 provider 別 code path (Stripe / Paddle / Lemon Squeezy for payment、 BullMQ / Inngest / Cloudflare Queues / AWS SQS / RabbitMQ for queue、 etc.) は同 `.mutation-baseline/{package}.json` shape に維持。

**provider 別 baseline pattern** — SaaS layer package の baseline JSON `survivedIds` field は provider 別 mutant を包含する list、 `PACKAGE_TIER` map は単一 file (`scripts/check-mutation-gates.mjs`) に維持、 provider 別 override は禁止 (tier は package 単位)。

### v1.27-4 release gate 12-axis 拡張 (Issue #959)

`@kiwa/quality-metrics` v0.3 で `evaluateReleaseGate(report, thresholdOverrides, ctx)` の第 3 引数に `ReleaseGateContext` type を追加、 `ctx.mutationTier` が set された時のみ 12th axis (`mutation.tier`) を発動、 tier floor 未達で `mutation.tier` axis を fail。

```ts
import {
  assembleReport,
  evaluateReleaseGate,
  resolveMutationTier,
  mutationFromCounts,
  DEFAULT_MUTATION_TIER_THRESHOLDS,
} from '@kiwa/quality-metrics';

const PACKAGE_TIER = {
  '@kiwa/core': 'Core',
  '@kiwa/nextjs': 'Framework',
  '@kiwa/payment': 'SaaS',
  '@kiwa/a11y': 'TestType',
} as const;

const tier = resolveMutationTier('@kiwa/payment', PACKAGE_TIER); // 'SaaS'
const report = assembleReport({
  mutation: mutationFromCounts({ killed: 130, survived: 60, timeout: 8, error: 2 }),
  // ...
});
const verdict = evaluateReleaseGate(report, {}, { mutationTier: tier });
// verdict.mutation.tier === 'PASS' if kill rate >= 65 %, 'FAIL' otherwise
// tier floor 未達 error は `MutationTierBelowFloor` (offending tier + package + rate + floor を carry)
```

既存 7 / 11 axis caller は `ctx.mutationTier` 未指定なら unchanged、 v0.2 caller は 1 行も変更不要 (additive-only 契約)。

### v1.27-5 docs 補強 (Issue #968)

`docs/tutorials/50-mutation-testing-baseline.md` (Stryker + kill-rate baseline + tier gate walkthrough) + `docs/tutorials/51-mutation-baseline-migration.md` (22 → 33 package sweep methodology) + `docs/concepts/mutation-testing-ssot.md` (4 rule SSOT = kill rate + 4 tier + baseline persistence + 12-axis gate) + `docs/migrations/v1.26-to-v1.27.md` (additive-only migration guide) を新規追加、 v0.3 API と直接照合可能な 20 snippet-validation test を `packages/quality-metrics/tests/docs-tutorial-v1.27.test.ts` に land、 tutorial の code snippet drift を構造的に遮断 (v1.22-1.26 pattern の 6 度目の適用、 6 milestone 連続 snippet test 化 pattern)。

## Numbers

- **6 sub-Issues resolved** (#957 / #963 / #966 / #959 / #968 / #961)
- **6 PRs merged** (v1.27-1 through v1.27-6)
- **1 npm minor bump** (`@kiwa/quality-metrics` v0.2.0 → v0.3.0) — kiwa runtime fixture count stays 34
- **33 packages** with Stryker rollout (22 already had a config from earlier milestones, 11 new in v1.27-1 through v1.27-3)
- **4 tiers** (Core 80 % / Framework 70 % / SaaS 65 % / Test type 60 %) in the mutation threshold SSOT
- **12 axes** on the release gate (mutation.tier axis is the new one)
- **20 snippet-validation tests** in `packages/quality-metrics/tests/docs-tutorial-v1.27.test.ts`

## 17-milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → **v1.27 (Mutation testing sweep)**。 v1.11 以降全 milestone で 6 sub-Issue 完遂維持。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)
- Mutation sweep II — property-based mutation (Stryker + fast-check integration + shrink parser)

feedback welcome。

## 参照

- Repo ... https://github.com/cardene777/kiwa
- Docs ... https://cardene777.github.io/kiwa/
- Roadmap ... https://github.com/cardene777/kiwa#roadmap
- v1.27 parent Issue ... https://github.com/cardene777/kiwa/issues/955
- Mutation testing SSOT ... https://cardene777.github.io/kiwa/concepts/mutation-testing-ssot
