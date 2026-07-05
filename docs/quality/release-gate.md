# kiwa release gate — 12 軸 SSOT (v1.27-4+)

kiwa provider が「release 可」 と判定される 12 軸の閾値 SSOT。 `@kiwa-test/quality-metrics` package の `DEFAULT_RELEASE_GATE_THRESHOLDS` (共通 7 軸 + AI-LLM 4 軸) と `DEFAULT_MUTATION_TIER_THRESHOLDS` (v1.27-4 で追加された 12 番目 axis の tier default 表) に 1:1 で対応する。 provider 個別に上書き可能だが、 その場合は overrides 理由を該当 provider の PR body に明記する。

v1.11 で確立した共通 7 軸 (Issue #681) に、 v1.12 milestone (Issue #695) で AI-LLM 4 軸 (cost / latency / token / accuracy) を追加、 v1.27-4 (Issue #959) で mutation kill rate の 4-tier 判定を第 12 軸として追加した。 12 番目の `mutation.tier` axis は opt-in で有効化する (`evaluateReleaseGate` の第 3 引数 `context.mutationTier` を渡した provider のみ)、 legacy 7 / 11 軸経路は完全に後方互換に保つ。

## SSOT 表 — 共通 7 軸 (全 provider)

| 軸 | 閾値 | 比較 | 根拠 |
|---|---|---|---|
| coverage — line | 85% | ≥ | 業界標準の「85% line floor」 に合わせる |
| coverage — branch | 80% | ≥ | 業界標準の「80% branch floor」 に合わせる |
| coverage — function | 90% | ≥ | 全 exported function を最低 1 test で touch |
| fidelity — ratio | 70% | ≥ | 「実 provider の主要 API の 7 割は mock cover」 の bar |
| perf — p95 ms | 100ms | ≤ | unit-scope adapter setup + call の bar |
| mutation — killRate | 60% | ≥ | mutation testing の「6 割は殺せる」 test suite の bar |
| test count — behavior | 10 | ≥ | 最低 10 個の behavior test で API 網羅 |

## SSOT 表 — AI-LLM 4 軸 (`@kiwa-test/ai-*` provider のみ強制)

| 軸 | 閾値 | 比較 | 根拠 |
|---|---|---|---|
| cost — perRequestUsd | $0.10 | ≤ | Anthropic Claude Haiku / OpenAI gpt-4o-mini 実勢価格帯の bar (bulk 呼出時のコスト暴騰検出) |
| latency — p95 ms | 3000ms | ≤ | streaming LLM の user-facing 「体感許容 3 秒」 bar |
| token — totalTokens | 4000 | ≤ | 4k context model 前提の context bloat 検出 |
| accuracy — score | 0.80 | ≥ | embedding cosine similarity 0.80 = 意味的に近いと判定される bar |

非 AI-LLM provider は 7 軸全て clear で「release 可」、 AI-LLM provider は 11 軸全て clear で「release 可」。 1 軸でも不足なら release blocker として PR に明示する。

## SSOT 表 — mutation.tier axis (v1.27-4、 opt-in で 12 軸目)

| tier | 閾値 | 比較 | 根拠 |
|---|---|---|---|
| core | 80% | ≥ | pure logic (deterministic tests、 no framework noise) |
| framework | 70% | ≥ | SSR / hydration / adapter drift 領域 |
| saas | 65% | ≥ | provider-specific adapter (external API drift 前提) |
| test-type | 60% | ≥ | DOM / browser noise を含む harness package |

tier 判定 SSOT は `docs/quality/mutation-thresholds.md`。 `evaluateReleaseGate(report, overrides, { mutationTier: 'saas' })` で opt-in、 tier 指定なしで従来の 7 / 11 軸経路を維持する。 per-package looser override (`.mutation-baseline/*.json` の override 値、 例 `@kiwa-test/auth` = 65 / `@kiwa-test/cache` = 60) は `context.mutationTierThreshold` で渡す。 legacy `mutation.killRate` axis と本 `mutation.tier` axis は並存 (置換ではない)、 v1.11 consumer の overrides もそのまま機能する。

## 使い方

### 共通 7 軸 (非 AI-LLM provider)

```ts
import {
  assembleReport,
  coverageFromV8Summary,
  evaluateReleaseGate,
  emitMarkdown,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
} from '@kiwa-test/quality-metrics';

const report = assembleReport({
  provider: '@kiwa-test/auth',
  version: '0.3.0',
  coverage: coverageFromV8Summary(covSummary.total),
  testCount: testCountFromCategories({ behavior: 236, integration: 8, e2e: 0 }),
  fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 42, realTotalMethods: 60 }),
  perf: perfFromSamples(latencyMs),
  mutation: mutationFromCounts({ mutations: 200, killed: 130 }),
});

const verdict = evaluateReleaseGate(report);
if (!verdict.passed) {
  console.error('blockers:', verdict.blockers);
  process.exit(1);
}
console.log(emitMarkdown({ report, verdict }));
```

### AI-LLM 11 軸 (`@kiwa-test/ai-*` provider)

```ts
import {
  accuracyFromSamples,
  assembleReport,
  costFromSamples,
  evaluateReleaseGate,
  latencyFromSamples,
  tokenFromSamples,
} from '@kiwa-test/quality-metrics';

const report = assembleReport({
  provider: '@kiwa-test/ai-llm',
  version: '0.1.0',
  coverage: covMetric,
  testCount: testMetric,
  fidelity: fidelityMetric,
  perf: perfMetric,
  mutation: mutationMetric,
  cost: costFromSamples(costSamplesUsd),
  latency: latencyFromSamples(endToEndLatencyMs),
  token: tokenFromSamples({ promptTokens, completionTokens }),
  accuracy: accuracyFromSamples({ samples: cosineSims, method: 'cosine' }),
});

const verdict = evaluateReleaseGate(report);
// verdict.axesEvaluated === 11
```

### mutation.tier 12 番目 (opt-in、 v1.27-4+)

```ts
import {
  DEFAULT_MUTATION_TIER_THRESHOLDS,
  assertMutationTier,
  evaluateReleaseGate,
  resolveMutationTier,
} from '@kiwa-test/quality-metrics';

// baseline JSON の verbal tier label は resolveMutationTier で enum 化。
const tier = resolveMutationTier('SaaS'); // -> 'saas'

// 単一 metric を tier default (または override) と突合する軽量 helper。
assertMutationTier({ metric, tier }); // throw on fail

// evaluateReleaseGate で 12 番目 axis として同時判定。
const verdict = evaluateReleaseGate(
  report,
  {},
  { mutationTier: tier /* , mutationTierThreshold: 60 */ },
);
// verdict.axesEvaluated === 8  (non AI-LLM + tier)
// verdict.axesEvaluated === 12 (AI-LLM + tier)
// mutation.tier axis 未達は `mutation.tier` blocker として surface。
```

`@kiwa-test/ai-llm` 使用時は `buildAiLlmReport` / `buildAiLlmReportFromMock` で `runFidelityCheck` の結果から直接 `QualityReport` を組み立てられる (詳細 = `packages/ai-llm/README.md`)。

## AI-LLM 分岐の判定

`isAiLlmProvider(provider: string): boolean` が SSOT。 `@kiwa-test/quality-metrics` から export、 判定は `provider.startsWith('@kiwa-test/ai-')` の 1 行。 downstream consumer (dogfood app 等) は本 helper を import して同一判定を使う。

## overrides の運用

provider 特性で default 閾値を満たせない場合、 overrides を `evaluateReleaseGate(report, { ... })` で渡す。 overrides は provider の PR body で「なぜ default から外れるのか」 を必ず明記する。

例 ... 「高精度モデル使用のため `costPerRequestUsd: 0.5` に緩和、 accuracy 0.95 まで押上げる代償」。

## release gate 未達での handling

- 3 軸以上 fail ... **release 停止**、 該当 PR は draft に戻す
- 1-2 軸 fail ... **release 継続可**、 ただし次 minor version で改善する task を issue 起票する
- 全 pass ... **release 可**、 `docs/quality-reports/{package}-{version}.md` に emit して PR に添付

## 参考

- v1.10 milestone 完遂 (親 #666、 2026-07-02)
- v1.11 milestone 親 Issue #680、 sub #681 (7 軸 SSOT の源、 2026-07-02)
- v1.12 milestone 親 Issue #694、 sub #695 (AI-LLM 4 軸拡張、 本 SSOT 更新の源)
- v1.27 milestone 親 Issue #955、 sub #959 (mutation.tier 12 番目 axis、 4-tier threshold enforcement、 本 SSOT 更新の源)
- `docs/quality/mutation-thresholds.md` (mutation kill rate 4-tier SSOT + baseline JSON schema + `.mutation-baseline/*.json` の verbal tier label)
- `@kiwa-test/quality-metrics` v0.2 (`packages/quality-metrics`)
- `@kiwa-test/ai-llm` v0.1 (`packages/ai-llm`)
