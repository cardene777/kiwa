# Security DevSecOps の使い方

この library が確認するのは scanner の orchestration contract です。report の completed は adapter が定義した状態遷移を終えたことを意味し、target の脆弱性がないことを意味しません。実スキャンを行う CI job と、その report を読み CI を判定する application code を分けて扱います。

## Supply chain の report を確認する

`supply-chain` preset は SCA と container security だけを順に実行します。CI の unit test では、選んだ axis と report の集約を固定します。

```ts
import { expect, it } from "vitest";
import {
  axisForPreset,
  runSecurityAudit,
  summarizeAuditReport,
} from "@kiwa-lab/security-devsecops";

it("collects the two supply-chain axes", async () => {
  expect(axisForPreset("supply-chain")).toEqual(["sca", "container-security"]);

  const report = await runSecurityAudit({
    preset: "supply-chain",
    target: "/workspace",
    mode: "mock",
    metadata: { runId: "ci-42" },
  });
  const summary = summarizeAuditReport(report);

  expect(summary.totalAxis).toBe(2);
  expect(summary.completedAxis).toBe(2);
  expect(summary.perAxis.map((item) => item.axis).sort()).toEqual([
    "container-security",
    "sca",
  ]);
});
```

この assertion は `/workspace` を実際に調べません。脆弱性の有無を CI の合否に使うなら、実 scanner job の出力を別途 parse して policy に照らす integration step を追加します。

## Real mode を実スキャンと混同しない

real mode は opt-in の環境 gate です。たとえば SCA axis には `KIWA_SECURITY_MODE=real` と `KIWA_TRIVY_URL` が必要です。環境変数がない場合は adapter が reject するため、CI config の不足を test できます。

```ts
import { expect, it } from "vitest";
import { runSecurityAudit } from "@kiwa-lab/security-devsecops";

it("rejects a real-mode audit without the required scanner configuration", async () => {
  await expect(
    runSecurityAudit({ preset: "supply-chain", target: "/repo", mode: "real" }),
  ).rejects.toThrow(/KIWA_SECURITY_MODE/);
});
```

`audit-all` を real mode で通すには、Semgrep、Trivy、Gitleaks、tfsec、ZAP、Grype に対応する URL environment をすべて設定します。それでもこの package は CLI を起動せず URL に接続しません。実 scanner の availability と finding は scanner 専用の job で確認します。

## Threat model の tag を確認する

`threat-model` preset は六 axis を選び、summary に axis ごとの STRIDE tag を加えます。completed axis は `medium`、未完了 axis は `high` になります。この severity は scanner finding の severity ではなく、orchestration が未完了であることを示す label です。

```ts
import { expect, it } from "vitest";
import { runSecurityAudit, summarizeAuditReport } from "@kiwa-lab/security-devsecops";

it("adds a STRIDE tag for each threat-model axis", async () => {
  const report = await runSecurityAudit({
    preset: "threat-model",
    target: "/repo",
    mode: "mock",
  });
  const summary = summarizeAuditReport(report);

  expect(summary.stridDreadTags).toHaveLength(6);
  expect(summary.stridDreadTags?.every((tag) => tag.tag.startsWith("stride:"))).toBe(true);
});
```

## 実行と CI の分担

このページの例を `tests/security-devsecops-flows.test.ts` に保存して実行します。

```bash
pnpm exec vitest run tests/security-devsecops-flows.test.ts
```

成功時は preset、env gate、report tag の contract を確認できます。実 scanner、target file、network、temporary report は作られません。CI では実 scanner job を別に配置し、その JSON や SARIF の policy 判定をこの orchestration test と別に維持してください。
