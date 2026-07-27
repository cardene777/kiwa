# Baseline と比較する

性能回帰を判断するときは、現在の一回の計測値を閾値と比べるだけでは足りません。同じ operation を複数回計測して baseline に保存し、同じ実行環境で測り直した現在値と比べます。`@kiwa-lab/perf-harness` は baseline に Node.js、OS、CPU、hostname、git SHA を記録します。環境が違う結果は比較の根拠にならないため、gate に渡す前に `envMismatch` が空であることを必ず確認してください。

以下は baseline の初回作成、二回目の読み込み、p95 の回帰判定、明示的な p95 gate を一つの test file にまとめた例です。`buildMeasureResult` は説明用の固定 sample を組み立てる helper です。実際の operation は [Quickstart](./quickstart) の `measure` で測定した結果に置き換えます。

## 実行できる比較 test

`tests/reply-baseline.perf.test.ts` に保存してください。

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  buildMeasureResult,
  detectRegression,
  evaluatePerfGate,
  loadBaseline,
  saveBaseline,
} from "@kiwa-lab/perf-harness";

it("同じ環境の baseline と p95 を比較する", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kiwa-perf-"));
  const baselinePath = join(directory, "reply.json");

  try {
    const baseline = buildMeasureResult(
      "reply",
      40,
      3,
      Array.from({ length: 40 }, (_, index) => 10 + (index % 3) * 0.05),
    );
    const current = buildMeasureResult(
      "reply",
      40,
      3,
      Array.from({ length: 40 }, (_, index) => 11 + (index % 3) * 0.05),
    );

    await saveBaseline(baselinePath, baseline);
    const loaded = await loadBaseline(baselinePath);

    expect(loaded).not.toBeNull();
    expect(loaded?.envMismatch).toEqual([]);

    const comparison = detectRegression({
      current,
      baseline: loaded!.envelope.results.reply!,
      threshold: 0.2,
    });
    expect(comparison.verdict).toBe("stable");
    expect(comparison.deltaPct).toBeLessThan(0.2);

    const gate = evaluatePerfGate({
      result: current,
      thresholds: { p95Ms: 20 },
    });
    expect(gate.verdict).toMatchObject({ passed: true, blockers: [] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
```

実行します。

```bash
pnpm exec vitest run tests/reply-baseline.perf.test.ts
```

`saveBaseline` は `MeasureResult` を環境情報付きの envelope として保存します。`loadBaseline` が返す `null` は、まだ比較対象がないという意味です。そのときは今回の計測結果を review して baseline としてコミットし、次回以降に初めて回帰を判定します。既存 baseline を成功した測定で自動更新すると、遅くなった変更を新しい基準として隠してしまうため、更新は別の review として扱ってください。

`detectRegression` は current と baseline の p95 の差を bootstrap で再標本化します。信頼区間がゼロをまたがず、かつ p95 の悪化率が `threshold` 以上のときだけ `regressed` になります。この例の 10% 程度の悪化は、20% の許容率内なので `stable` です。sample が二件未満の場合は統計的な比較をせず `stable` になるため、少数 sample の結果を release の根拠にしないでください。

## 三層の測定を使う場面

単一の関数が速いだけでは、並行実行時の待ち時間や buffer の保持は分かりません。`runPerf3Layer` は同じ operation に対して serial、concurrent、memory を測定し、Markdown report と baseline を出力します。serial の p95 上限を指定し、concurrent は既定でその二倍、memory は `arrayBuffers` の増分を既定 100 KB 未満で判定します。heap の増分は report に残りますが、GC の影響が大きいため gate には使いません。

次のように既存の performance test から呼び出します。初回は `baselineSeeded` が `true` となり、比較 verdict はまだありません。二回目以降に同じ machine と git SHA で実行して、生成した report と baseline を review します。

```ts
const suite = await runPerf3Layer({
  moduleName: "reply-adapter",
  reportPath: ".perf-report/reply-adapter.md",
  baselinePath: ".perf-baseline/reply-adapter.json",
  ops: [{ name: "reply", fn: async () => adapter.reply(), serialP95CapMs: 40 }],
});

expect(suite.allPassed).toBe(true);
```

外部 service、worker、database を測定する operation では、接続の作成と破棄を test の `try` と `finally` に入れてください。測定後の resource が残ると、次の sample や別の test を汚染します。共有 CI の一回の wall-clock 値は本番 SLA の証明ではありません。SLA を確認する負荷試験と、この library による変更前後の regression gate を分けて運用します。

<!-- skill-guide -->
## skill との使い分け

この library に package 固有の companion skill はありません。性能要件から test の下書きを作る場合は、初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer unit --module reply-adapter
/kiwa:kiwa-vitest --module reply-adapter
```

生成された test が測定対象、入力サイズ、warmup、iterations、許容する回帰率、baseline の保存先を明示していることを確認してください。skill はその値を自動で正しく決めるものではありません。
