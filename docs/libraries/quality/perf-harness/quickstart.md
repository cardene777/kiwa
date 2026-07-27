# Perf Harness の導入

`@kiwa-lab/perf-harness` は非同期 operation の実行時間を複数回測定し、p50、p95、p99、平均、標準偏差を返します。単発の `Date.now()` 比較ではなく、warmup 後の sample を残して性能の変化を test するための library です。このページでは、まず CI で壊れにくい測定 test を一つ作ります。ここで合格しても「十分に高速」という証明にはなりません。次のページで同じ環境の baseline と比較して、変更による悪化を判断します。

## インストールする

```bash
pnpm add -D @kiwa-lab/perf-harness vitest
```

## 小さな operation を測定する

次の内容を `tests/reverse-string.perf.test.ts` に保存してください。測定対象は副作用を持たず、反復しても同じ結果になる operation を選びます。

```ts
import { expect, it } from "vitest";
import { measure } from "@kiwa-lab/perf-harness";

it("reverse string operation の p95 を記録する", async () => {
  const result = await measure({
    name: "reverse-string",
    iterations: 20,
    warmup: 3,
    trimPercent: 5,
    fn: async () => "kiwa".split("").reverse().join(""),
  });

  expect(result.samples).toHaveLength(20);
  expect(result.p50).toBeGreaterThanOrEqual(0);
  expect(result.p95).toBeGreaterThanOrEqual(result.p50);
  expect(result.trimmed).toBeDefined();
});
```

warmup の sample は集計値から外れますが、`iterations` 回の本計測 sample は `result.samples` に残ります。`trimPercent` は元の sample を削除せず、外れ値を除いた別の集計を `result.trimmed` に作ります。性能が速いことを絶対値だけで assertion すると CI machine の差で flaky になるため、初回は sample の数と percentile の順序を確認します。たとえば「p95 が 10 ms 未満」のような上限は、測定機と許容理由を決めて baseline をレビューできる状態になってから追加します。

## 実行して確認する

```bash
pnpm exec vitest run tests/reverse-string.perf.test.ts
```

test が成功すると、sample 数と percentile の関係を確認できます。同じ operation を release gate に使う場合は [Baseline と比較する](./how-to) で baseline を保存し、環境差を確認してから回帰を判定してください。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。仕様から test の土台を作る場合は、初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

性能要件から test の下書きを作る場合は、まず operation、入力サイズ、反復回数、許容する回帰率を `kiwa-design` に書き出し、`kiwa-vitest` で test file を作ります。

```text
/kiwa:kiwa-design --layer unit --module reverse-string
/kiwa:kiwa-vitest --module reverse-string
```

生成物に warmup、iterations、比較する metric、失敗時に読む baseline が明示されていることを確認してから、作成した file だけを実行します。

```bash
pnpm exec vitest run tests/reverse-string.perf.test.ts
```

skill は測定対象、反復回数、許容する回帰率を自動で正しく決めるものではありません。同じ環境条件で測定し、release gate に使う値は [Baseline と比較する](./how-to) の手順で根拠を残してください。
