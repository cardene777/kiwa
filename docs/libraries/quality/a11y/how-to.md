# 違反を CI で判定する

ここでは、jsdom の DOM を serious 以上で gate し、その同じ結果を layer harness に集約します。`tests/checkout.a11y.test.ts` に保存して実行してください。test の後に DOM を戻すため、別の component test の fixture を汚しません。

## threshold と report を確認する

```ts
import { afterEach, expect, it } from "vitest";
import {
  expectNoViolations,
  reportViolations,
  runAxe,
  runLayerHarness,
} from "@kiwa-lab/a11y";

const originalBody = document.body.innerHTML;

afterEach(() => {
  document.body.innerHTML = originalBody;
});

it("checkout の labelled DOM を serious 以上で gate する", async () => {
  document.body.innerHTML = `
    <main id="checkout">
      <label for="email">Email</label>
      <input id="email" type="email" />
      <button type="submit">Pay</button>
    </main>
  `;
  const root = document.getElementById("checkout") as Element;
  const results = await runAxe({ context: root });
  const report = reportViolations(results, { maxImpact: "serious" });

  expect(report.blocking, report.summary).toEqual([]);
  expectNoViolations(results, expect, { maxImpact: "serious" });
});

it("jsdom layer を report に残し browser layer を不適用として記録する", async () => {
  document.body.innerHTML = '<button type="button" aria-label="close">×</button>';
  const report = await runLayerHarness("@acme/checkout", {
    jsdom: { context: document.body },
  });

  expect(report.layers.jsdom.applicable).toBe(true);
  expect(report.layers.playwright).toMatchObject({ applicable: false });
  expect(report.totals.critical).toBe(0);
  expect(report.ok).toBe(true);
});
```

`report.summary` を assertion message に渡すと、failure log に rule ID、impact、help、node 数が残ります。label を消すなどして blocking rule を意図的に一度発生させると、修正すべき target を CI で確認できます。threshold を緩めて通すのではなく、例外が必要な rule は理由と期限を project の policy へ残してください。

## browser と hydration を集約する

Playwright layer は harness が browser を起動するものではありません。Playwright test 側で page に axe を注入して実行し、その返り値を `playwright: { results }` として渡します。これにより jsdom の result と同じ report shape で集計できます。page の結果を渡さずに `playwright` field を省略した場合は、layer は `applicable: false` になります。

SSR hydration layer には `ssrHtml` と、必要であれば hydration 後の `Element` または `Document` を渡します。同じ rule ID が両方にある場合、harness は rule を一件にまとめ、node 数を合算します。SSR HTML が文字列でない場合や、jsdom environment がない場合は error になるため、SSR test は browser test と混ぜず jsdom runner で実行してください。

## 実行する

```bash
pnpm exec vitest run tests/checkout.a11y.test.ts
```

成功すると serious と critical の blocking rule はゼロで、jsdom layer は適用済み、browser layer は不適用として明示されます。実 browser の keyboard、focus、screen reader を確認する case は、この test を置き換えず Playwright E2E に追加してください。
