# @kiwa-lab/chart をはじめる

`@kiwa-lab/chart` は、chart component へ渡すデータを lightweight な SVG 風 tree に変換し、表示する系列を test する harness です。この Quickstart では、売上の棒グラフを描画し、series が記録されることと、空の結果を series のない chart として扱うことを確認します。browser の DOM、canvas、実際の Recharts や D3 は起動しません。

## インストール

```bash
pnpm add -D @kiwa-lab/chart vitest
```

## 売上データを描画対象にする

次の内容を `tests/revenue-chart.test.ts` にそのまま保存してください。test 対象は component の見た目ではなく、component へ渡す `kind`、series、色、空データの扱いです。`now` を固定しておくと、描画履歴に含まれる時刻も安定して確認できます。

```ts
import { expect, it } from "vitest";
import { createChartClient } from "@kiwa-lab/chart";

it("売上系列を記録し、空の結果を明示する", () => {
  const client = createChartClient({ provider: "recharts", now: () => 1_000 });
  const revenue = client.renderChart({
    kind: "bar",
    title: "売上",
    width: 200,
    height: 100,
    series: [{
      name: "sales",
      color: "#2563eb",
      data: [{ x: "Jan", y: 10 }, { x: "Feb", y: 20 }],
    }],
  });
  const empty = client.renderChart({ kind: "bar", series: [] });

  expect(revenue).toMatchObject({
    id: "rc-1",
    provider: "recharts",
    renderedAt: 1_000,
    tree: {
      type: "svg",
      attrs: { width: 200, height: 100, "data-title": "売上" },
      meta: { kind: "bar", seriesCount: 1 },
    },
  });
  expect(revenue.tree.children).toHaveLength(2);
  expect(empty.tree.meta?.seriesCount).toBe(0);
  expect(client.captureLegend(empty)).toEqual([]);
  expect(client.listRendered()).toHaveLength(2);
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/revenue-chart.test.ts
```

成功時には、売上 chart は二つの bar node を持ち、空データは legend のない chart になります。bar の高さはこの mock で `y` を百基準に換算した値です。その座標を実画面の高さや百分率の根拠には使わないでください。

## 次に行うこと

非表示系列、tooltip、drill-down、export は [使い方](./how-to) で一つの dashboard workflow として扱います。文字の折返し、resize observer、canvas または SVG の見た目、pointer event は provider component の test や visual regression の対象です。

<!-- skill-guide -->
## skill で test を作る

`/kiwa:kiwa-chart` で chart test の下書きを作れます。初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-chart --module revenue --type line --provider recharts --output tests/integration/revenue.chart.test.ts
```

生成後は series 名、非表示条件、利用者が確認する tooltip の値を実際の仕様に置き換え、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/integration/revenue.chart.test.ts
```

skill の引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-chart/SKILL.md) を参照してください。
