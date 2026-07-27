# Quality Metrics の導入

`@kiwa-lab/quality-metrics` は coverage、test count、fidelity、performance、mutation、accessibility の測定値を同じ release gate に渡すための collector と evaluator です。test runner の結果を自動で読むものではなく、正規化した metric を明示して policy と照合します。

## インストールする

```bash
pnpm add -D @kiwa-lab/quality-metrics vitest
```

## mutation metric を tier と照合する

次の内容を `tests/quality-metrics.test.ts` に保存してください。Core tier の mutation kill rate を計算し、閾値を満たすことを確認します。

```ts
import { expect, it } from "vitest";
import {
  assertFidelity,
  mutationFromCounts,
  resolveMutationTier,
} from "@kiwa-lab/quality-metrics";

it("Core tier の mutation result を正規化する", () => {
  const mutation = mutationFromCounts({ mutations: 100, killed: 80 });

  expect(mutation).toMatchObject({ survived: 20, killRate: 80 });
  expect(resolveMutationTier("core")).toBe("core");
});

it("mock と real adapter の戻り値が一致することを確認する", async () => {
  const result = await assertFidelity({
    mockFn: async (id: string) => ({ id }),
    realFn: async (id: string) => ({ id }),
    cases: [{ name: "existing user", args: ["user-1"] }],
  });

  expect(result).toMatchObject({ passed: 1, failed: 0, ratio: 100 });
});
```

`mutations` が 0 の metric は kill rate 0 であり、mutation test が不要という意味ではありません。`assertMutationTier()` や release gate では no signal として失格になります。fidelity では戻り値だけでなく、片方だけの例外や異なる error message も divergence として扱います。

## 実行して確認する

```bash
pnpm exec vitest run tests/quality-metrics.test.ts
```

2 つの test が成功すると、metric の正規化と adapter fidelity を確認できます。release gate へ追加し、tier 未達時の blocker を確認する場合は [Tier を release gate に追加する](./how-to) を参照してください。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。[kiwa の skill を使う](../../../guides/skills) で test を設計する場合も、metric の分母、tier、許容する divergence を生成物に任せず、release policy とこの Quickstart の assertion で明示してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer unit --module quality-gate
/kiwa:kiwa-vitest --module quality-gate
```

生成後は、対象ファイルだけを実行します。

```bash
pnpm exec vitest run tests/quality-metrics.test.ts
```
