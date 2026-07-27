# Visual の導入

この手順では、review 済み baseline と同じ screenshot を PNG buffer として比較し、完全一致を確認します。実際の screenshot を取得する部分は Playwright などの E2E runner に任せます。ここで検証するのは、取得済み PNG をどう比較し、サイズ違いをどう検出するかです。

## 依存関係を追加する

```bash
pnpm add -D @kiwa-lab/visual pixelmatch pngjs vitest
```

`@kiwa-lab/visual` は `pixelmatch` と `pngjs` を runtime に読み込みます。どちらも test の依存関係として追加してください。

## PNG の合否を test にする

次の内容を `tests/home.visual.test.ts` にそのまま保存してください。実プロジェクトでは `buildPng` の代わりに Playwright が作った actual PNG と、レビュー済み baseline を `readFile` で渡します。この例は同じ buffer の成功と、サイズが違う screenshot の失敗を一つの file で確認します。

```ts
import { expect, test } from "vitest";
import { PNG } from "pngjs";
import { comparePngBuffers, expectNoVisualDiff } from "@kiwa-lab/visual";

function buildPng(
  width: number,
  height: number,
  fill: [number, number, number, number],
): Buffer {
  const image = new PNG({ width, height });
  for (let index = 0; index < width * height; index += 1) {
    image.data.set(fill, index * 4);
  }
  return PNG.sync.write(image);
}

test("review 済み baseline と同じ screenshot を通す", async () => {
  const baseline = buildPng(4, 4, [37, 99, 235, 255]);
  const actual = buildPng(4, 4, [37, 99, 235, 255]);
  const result = await comparePngBuffers(baseline, actual, {
    threshold: 0.1,
    maxDiffRatio: 0.005,
  });

  expect(result).toMatchObject({
    size: { width: 4, height: 4 },
    diffPixels: 0,
    diffRatio: 0,
    ok: true,
  });
  expectNoVisualDiff(result, expect);
});

test("異なる screenshot size を比較しない", async () => {
  const baseline = buildPng(4, 4, [37, 99, 235, 255]);
  const actual = buildPng(5, 4, [37, 99, 235, 255]);

  await expect(comparePngBuffers(baseline, actual)).rejects.toThrow(
    /size mismatch/,
  );
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/home.visual.test.ts
```

成功時には、同じ大きさで同じ画素の PNG は差分ゼロになり、サイズが異なる PNG は比較前に失敗します。実際の baseline と actual では、viewport、device scale factor、browser version、font、画面 state を揃えてください。

## 次に行うこと

差分 PNG を CI artifact として保存し、baseline 更新をレビューする手順は [差分画像を保存する](./how-to) を参照してください。画面操作と screenshot の取得は [E2E](/libraries/foundation/e2e/) を、role や accessible name の検証は [A11y](/libraries/quality/a11y/) を使います。

<!-- skill-guide -->
## skill で visual test を作る

この library の companion skill は、仕様を input にして screenshot runner の test を作ります。初回だけ plugin を導入し、Quickstart の比較契約を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer visual --module checkout
/kiwa:kiwa-visual --module checkout
```

生成後は viewport、state、mask 対象、threshold、baseline と actual の path を仕様に合わせて確認し、生成された file だけを実行します。

```bash
pnpm exec playwright test tests/visual/checkout.spec.ts
```

初回に作られた baseline は、画面が意図どおりであることをレビューしてから version control に追加します。skill の仕様は [kiwa-visual](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-visual/SKILL.md) を参照してください。
