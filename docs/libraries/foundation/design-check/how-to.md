# layout の回帰を検証する

layout regression は screenshot の pixel diff ではありません。baseline と actual の selector ごとの位置、サイズ、可視性を比較し、許容範囲を超えた移動、overflow、意図しない overlap、欠落を報告します。採取側で viewport、device scale factor、font、locale、時刻、fixture data を固定してから値を渡してください。

次の内容全体を `tests/header.layout.test.ts` に保存します。許容範囲内の移動、assertion による CI failure、overflow と overlap の検出を同じ入力形式で確認できます。

```ts
import { expect, test } from "vitest";
import {
  assertNoLayoutRegression,
  checkLayoutRegression,
} from "@kiwa-lab/design-check";

const baseline = {
  elements: [
    { selector: '[data-testid="header"]', x: 0, y: 0, width: 1280, height: 64, visible: true },
    { selector: '[data-testid="content"]', x: 24, y: 88, width: 800, height: 480, visible: true },
  ],
};

test("keeps a two-pixel header move within tolerance", () => {
  const actual = {
    elements: [
      { selector: '[data-testid="header"]', x: 2, y: 0, width: 1280, height: 64, visible: true },
      { selector: '[data-testid="content"]', x: 24, y: 88, width: 800, height: 480, visible: true },
    ],
  };

  const result = checkLayoutRegression(baseline, actual, {
    positionTolerance: 2,
    sizeTolerance: 2,
    viewportWidth: 1280,
    viewportHeight: 720,
  });

  expect(result.pass).toBe(true);
  expect(result.regressions).toEqual([]);
});

test("makes an overflow and overlap fail the CI assertion", () => {
  const actual = {
    elements: [
      { selector: '[data-testid="header"]', x: 0, y: 0, width: 1300, height: 64, visible: true },
      { selector: '[data-testid="content"]', x: 24, y: 40, width: 800, height: 480, visible: true },
    ],
  };

  const result = checkLayoutRegression(baseline, actual, {
    viewportWidth: 1280,
    viewportHeight: 720,
  });

  expect(result.pass).toBe(false);
  expect(result.regressions.map((item) => item.kind)).toContain("overflow");
  expect(result.regressions.map((item) => item.kind)).toContain("overlap");
  expect(() => assertNoLayoutRegression(baseline, actual, {
    viewportWidth: 1280,
    viewportHeight: 720,
  })).toThrow("layout regression detected");
});
```

## 判定の境界を理解する

position と size の既定 tolerance はともに 2px で、差が tolerance より大きいときに失敗します。そのため 2px の差は許容され、3px から regression です。overflow は `viewportWidth` または `viewportHeight` を渡したときだけ検出します。右端と下端を超える配置を扱い、左方向または上方向の画面外配置は検出しません。

overlap は actual 内の可視要素の矩形を比較します。1px でも面積が交差すれば報告されます。tooltip、badge、modal のように意図して重なる要素は、対象 selector を絞った snapshot を作り、通常 layout と同じ baseline に混ぜないでください。同一 selector が重複すると actual 側では最後の要素だけが比較対象になるため、snapshot では selector を一意にします。

`assertNoLayoutRegression` は `pass` が false なら Error を投げるため CI に向いています。調査中は `checkLayoutRegression` の `regressions` を表示して原因を判断します。baseline を更新するのは、意図した UI 変更であることを確認してからです。browser の pixel diff、font load、CSS computed style、animation はこの library の責務ではありません。

## 実行する

```bash
pnpm exec vitest run tests/header.layout.test.ts
```
