# @kiwa-lab/chart の使い方

ここでは dashboard の注文データを例に、内部系列を利用者向けの表示から除外し、scatter point から tooltip と drill-down の対象を選び、同じ chart を export します。全てを一つの workflow として固定すると、表示対象を誤ったのか、操作対象を誤ったのか、download に渡す形式を誤ったのかを切り分けられます。

## dashboard のデータ契約を確認する

次の内容を `tests/orders-dashboard.chart.test.ts` にそのまま保存してください。hidden series は描画 tree に入らないので legend にも入りません。scatter の tooltip は渡した pointer 座標に最も近い point を選び、`drillDown` は series と data index で選びます。

```ts
import { expect, it } from "vitest";
import {
  computeResponsiveDimensions,
  createChartClient,
  drillDown,
  exportChart,
  renderChart,
} from "@kiwa-lab/chart";

it("注文 dashboard の表示、操作、export を同じ spec で確認する", () => {
  const client = createChartClient({ provider: "d3" });
  const interactive = client.renderChart({
    kind: "scatter",
    width: 100,
    height: 100,
    series: [
      { name: "orders", data: [{ x: 10, y: 25 }] },
      { name: "internal", data: [{ x: 10, y: 80 }], hidden: true },
    ],
  });

  expect(interactive.tree.meta?.seriesCount).toBe(1);
  expect(client.captureLegend(interactive).map(entry => entry.name)).toEqual(["orders"]);
  expect(client.dispatchTooltip(interactive, { x: 10, y: 75 })).toMatchObject({
    visible: true,
    series: "orders",
    value: 25,
    targetType: "circle",
  });
  expect(drillDown(interactive.tree, { seriesName: "orders", dataIndex: 0 })).toMatchObject({
    found: true,
    value: 25,
  });

  const size = computeResponsiveDimensions(320);
  const exportable = renderChart({
    kind: "bar",
    width: size.width,
    height: size.height,
    series: [{ name: "orders", data: [{ x: 0, y: 10 }] }],
  });
  const exported = exportChart(exportable, { format: "svg" });

  expect(size).toMatchObject({ width: 320, breakpoint: "mobile" });
  expect(exportable.attrs).toMatchObject({ width: 320, height: size.height });
  expect(exported).toMatchObject({ format: "svg" });
  expect(exported.content).toContain("<svg");
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/orders-dashboard.chart.test.ts
```

成功時には、`internal` は tree と legend のどちらにも残らず、`orders` の point が tooltip と drill-down の同じ対象になります。export は download 処理へ渡せる SVG string を返します。PNG を指定した場合も、ここで返るのは実画像ではなく base64 の mock です。

## 実ブラウザで確認すること

line の polyline と pie の path には座標 attribute がないため、この harness の tooltip は対象にしません。line chart の hover、軸 label の重なり、log scale の domain、CSS layout、resize observer、a11y、pixel の見た目は、採用した provider component の browser test または visual regression で検証してください。`scale: "log"` は axis 結果へ記録されますが、この mock は対数変換を実行しません。

ここで固定するのは、API から受け取った series の選別と、操作で選ぶ data point と、export に渡す tree です。tree と補助 API の全契約は [リファレンス](./reference) を参照してください。
