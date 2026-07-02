# kiwa release gate — 5 軸 SSOT (v1.11+)

kiwa provider が「release 可」 と判定される 5 軸の閾値 SSOT。 `@kiwa-test/quality-metrics` package の `DEFAULT_RELEASE_GATE_THRESHOLDS` と 1:1 で対応する。 provider 個別に上書き可能だが、 その場合は overrides 理由を該当 provider の PR body に明記する。

## SSOT 表

| 軸 | 閾値 | 比較 | 根拠 |
|---|---|---|---|
| coverage — line | 85% | ≥ | 業界標準の「85% line floor」 に合わせる |
| coverage — branch | 80% | ≥ | 業界標準の「80% branch floor」 に合わせる |
| coverage — function | 90% | ≥ | 全 exported function を最低 1 test で touch |
| fidelity — ratio | 70% | ≥ | 「実 provider の主要 API の 7 割は mock cover」 の bar |
| perf — p95 ms | 100ms | ≤ | unit-scope adapter setup + call の bar |
| mutation — killRate | 60% | ≥ | mutation testing の「6 割は殺せる」 test suite の bar |
| test count — behavior | 10 | ≥ | 最低 10 個の behavior test で API 網羅 |

7 軸全て clear で「release 可」、 1 軸でも不足なら release blocker として PR に明示する。

## 使い方

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

// 5 軸を collect
const report = assembleReport({
  provider: '@kiwa-test/auth',
  version: '0.3.0',
  coverage: coverageFromV8Summary(covSummary.total),
  testCount: testCountFromCategories({ behavior: 236, integration: 8, e2e: 0 }),
  fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 42, realTotalMethods: 60 }),
  perf: perfFromSamples(latencyMs),
  mutation: mutationFromCounts({ mutations: 200, killed: 130 }),
});

// release gate 判定
const verdict = evaluateReleaseGate(report);
if (!verdict.passed) {
  console.error('blockers:', verdict.blockers);
  process.exit(1);
}

// markdown report 出力
console.log(emitMarkdown({ report, verdict }));
```

## overrides の運用

provider 特性で default 閾値を満たせない場合、 overrides を `evaluateReleaseGate(report, { ... })` で渡す。 overrides は provider の PR body で「なぜ default から外れるのか」 を必ず明記する。

## release gate 未達での handling

- 3 軸以上 fail ... **release 停止**、 該当 PR は draft に戻す
- 1-2 軸 fail ... **release 継続可**、 ただし次 minor version で改善する task を issue 起票する
- 全 pass ... **release 可**、 quality-reports/{package}-{version}.md に emit して PR に添付

## 参考

- v1.10 milestone 完遂 (親 #666、 2026-07-02)
- v1.11 milestone 親 Issue #680、 sub #681 (本 SSOT の源)
- `@kiwa-test/quality-metrics` v0.1 (packages/quality-metrics)
