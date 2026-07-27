# Design Check の導入

このガイドでは、承認済み design token と取得済みの実装値を比較します。値の取得方法は任意ですが、同じ theme と viewport で採取した値を渡してください。`@kiwa-lab/design-check` 自身は browser を起動せず、渡された値を決定論的に比較します。

## インストールする

```bash
pnpm add -D @kiwa-lab/design-check vitest
```

## 仕様適合を確認する

次の内容全体を `tests/button.design.test.ts` に保存します。最初の test は承認済み token が一致することを確認し、二つ目は差分の読み方を固定します。別の snippet を組み合わせる必要はありません。

```ts
import { describe, expect, it } from "vitest";
import { checkSpecConformance } from "@kiwa-lab/design-check";

describe("button tokens", () => {
  it("matches the approved token values", () => {
    const result = checkSpecConformance(
      {
        colors: { primary: "#3b82f6" },
        spacing: { md: 16 },
        typography: { body: { fontSize: 14, lineHeight: 20 } },
        components: { Button: { paddingInline: 16, radius: 8 } },
      },
      {
        colors: { primary: "#3b82f6" },
        spacing: { md: 16 },
        typography: { body: { fontSize: 14, lineHeight: 20 } },
        components: { Button: { paddingInline: 16, radius: 8 } },
      },
    );

    expect(result.pass).toBe(true);
    expect(result.checkedCount).toBe(4);
    expect(result.divergences).toEqual([]);
  });

  it("reports a changed value with its spec path", () => {
    const result = checkSpecConformance(
      { spacing: { md: 16 } },
      { spacing: { md: 12 } },
    );

    expect(result.pass).toBe(false);
    expect(result.divergences).toEqual([
      { path: "spacing.md", expected: 16, actual: 12, category: "mismatch" },
    ]);
  });
});
```

`checkedCount` は token の総数ではなく、比較した top-level spec entry の数です。この例では color、spacing、typography、component を一件ずつ数えます。typography と component はその配下の property を個別に照合します。actual に spec の key がなければ `missing`、値が異なれば `mismatch` になります。actual にだけある key は現在の比較器では検出しないため、不要な token は schema validation または lint で扱ってください。

## 実行する

```bash
pnpm exec vitest run tests/button.design.test.ts
```

失敗した場合は `divergences` の path、期待値、actual を確認し、spec と実装のどちらを変更するかを先にレビューします。baseline を差分に合わせて即座に更新すると、意図しない design regression を承認してしまいます。

## 次に読む

[使い方](./how-to) で layout snapshot の回帰を検証します。[リファレンス](./reference) には assertion と tolerance の規則をまとめています。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。仕様から unit test の下書きを作る場合だけ、初回に plugin を導入してから汎用 skill を使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer unit --module button-design
/kiwa:kiwa-vitest --module button-design
```

生成後は token 名と実測値を承認済み spec に照合し、次の対象ファイルだけを実行します。

```bash
pnpm exec vitest run tests/button.design.test.ts
```
