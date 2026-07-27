# Security DevSecOps の導入

`@kiwa-lab/security-devsecops` は SAST、SCA、secret scan、IaC scan、DAST、container security を同じ audit report に集約します。mock mode は各 security tool を起動せず orchestration と report shape を test します。real mode も URL と環境変数を検証する gate であり、CLI や外部 API を直接実行する runner ではありません。

## インストールする

```bash
pnpm add -D @kiwa-lab/security-devsecops vitest
```

## audit report を確認する

次の内容を `tests/security-audit.test.ts` に保存してください。CI の最初の test では mock mode を使い、実行する axis と完了状態を固定します。

```ts
import { expect, it } from "vitest";
import {
  axisForPreset,
  runSecurityAudit,
  summarizeAuditReport,
} from "@kiwa-lab/security-devsecops";

it("supply-chain audit が SCA と container security を完了する", async () => {
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

mock result は `/workspace` を解析した脆弱性結果ではありません。workflow が想定した axis を実行し、report を受け取る application code を検証するための結果です。脆弱性の有無を CI の判定へ使う場合は、実 scanner の report を入力にする別の integration step を用意してください。

## 実行して確認する

```bash
pnpm exec vitest run tests/security-audit.test.ts
```

test が成功すると、preset と report の集約を確認できます。SAST、secret scan、DAST を含める場合は `specialty` preset、6 軸をまとめて確認する場合は `audit-all` preset を使います。各 axis の event と失敗時の扱いは [Supply chain を監査する](./how-to) を参照してください。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。[kiwa の skill を使う](../../../guides/skills) で仕様から test を設計する場合も、security scanner の実行結果を推測させず、preset、対象 path、許容する report をここで示したように明示してください。

初回は plugin を導入して再読込します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

CI orchestration の unit test を生成する場合は、次を実行します。

```text
/kiwa:kiwa-design --layer unit --module security-audit
/kiwa:kiwa-vitest --module security-audit
```

出力先を変更していなければ、生成 file だけを実行します。

```bash
pnpm exec vitest run tests/spec/security-audit.test.ts
```
