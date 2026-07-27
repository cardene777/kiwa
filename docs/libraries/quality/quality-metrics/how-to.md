# Tier を release gate に追加する

既存の品質 report に mutation と a11y の tier を追加し、通常 gate と個別 tier を同時に評価します。測定器そのものはこの library の外にあり、ここでは正規化済みの metric と release policy を照合します。

次の内容全体を `tests/release-gate.test.ts` に保存します。

```ts
import { expect, it } from "vitest";
import {
  a11yFromBaseline,
  evaluateReleaseGate,
  mutationFromCounts,
} from "@kiwa-lab/quality-metrics";

const report = {
  provider: "@kiwa-lab/example",
  version: "1.0.0",
  reportedAt: "2026-07-17T00:00:00Z",
  coverage: { line: 90, branch: 82, function: 95 },
  testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
  fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
  perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
  mutation: mutationFromCounts({ mutations: 100, killed: 80 }),
  a11y: a11yFromBaseline({ totals: { critical: 0, serious: 0, moderate: 2 } }),
};

it("passes the Core mutation and a11y tiers", () => {
  const verdict = evaluateReleaseGate(report, {}, {
    mutationTier: "core",
    a11yTier: "core",
  });

  expect(verdict).toMatchObject({ passed: true, blockers: [] });
});

it("reports no mutation signal as a blocker", () => {
  const verdict = evaluateReleaseGate({
    ...report,
    mutation: mutationFromCounts({ mutations: 0, killed: 0 }),
  }, {}, { mutationTier: "core", a11yTier: "core" });

  expect(verdict.passed).toBe(false);
  expect(verdict.blockers.map((blocker) => blocker.axis)).toContain("mutation.tier");
});
```

## blocker を release policy に戻す

mutation が 0 件の metric は kill rate が 0 であり、十分な test がある証明ではありません。tier assertion では no signal として失格です。通常 gate の mutation 下限 60 と tier 下限は並存します。Core tier では通常 gate を通過しても kill rate 80 未満なら fail です。

a11y では zero violation が期待する成功です。Core tier は critical 0、serious 0、moderate 3 を上限にします。`a11yTier` を指定したのに a11y metric がない場合は fail です。minor は tier gate の対象外です。失格時は `blockers` の axis、actual、threshold、比較演算子を確認し、threshold を隠すのではなく不足する測定値または test を修正します。

provider 名が `@kiwa-lab/ai-` で始まる report には cost、latency、token、accuracy の四軸が必須です。通常 provider に同じ metric を渡しても AI gate は有効になりません。測定 job の不備を pass として扱わないため、provider 名と必須 axis を合わせます。

## 実行する

```bash
pnpm exec vitest run tests/release-gate.test.ts
```
