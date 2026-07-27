# 差分画像を保存する

比較が失敗したときだけ diff PNG を保存すると、CI の数値だけでは判断できない描画差分を確認できます。baseline の更新は、actual と diff を見て意図した UI 更新だと判断した後に行います。差分を隠すために `maxDiffRatio` を上げる手順ではありません。

## artifact を残して失敗させる

次の内容を `tests/settings.visual.test.ts` にそのまま保存してください。`buildPng` は例を自己完結させるための fixture 作成です。実プロジェクトでは baseline と actual を screenshot runner の出力から `readFile` し、artifact path を CI が回収する場所にします。

```ts
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { PNG } from "pngjs";
import { comparePngBuffers, expectNoVisualDiff } from "@kiwa-lab/visual";

function buildPng(fill: [number, number, number, number]): Buffer {
  const image = new PNG({ width: 4, height: 4 });
  for (let index = 0; index < 16; index += 1) {
    image.data.set(fill, index * 4);
  }
  return PNG.sync.write(image);
}

test("差分 PNG を artifact として保存する", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kiwa-visual-"));
  const baselinePath = join(directory, "settings.baseline.png");
  const actualPath = join(directory, "settings.actual.png");
  const artifactPath = join(directory, "settings.diff.png");

  try {
    await writeFile(baselinePath, buildPng([0, 0, 0, 255]));
    await writeFile(actualPath, buildPng([255, 255, 255, 255]));
    const result = await comparePngBuffers(
      await readFile(baselinePath),
      await readFile(actualPath),
      { threshold: 0.1, maxDiffRatio: 0 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok && result.diffBuffer) {
      await writeFile(artifactPath, result.diffBuffer);
    }
    expect((await readFile(artifactPath)).length).toBeGreaterThan(0);
    expect(() => expectNoVisualDiff(result, expect)).toThrow(
      /Visual diff exceeded threshold/,
    );

    const strict = await comparePngBuffers(
      await readFile(baselinePath),
      await readFile(baselinePath),
      { threshold: 0, includeAA: true, maxDiffRatio: 0 },
    );
    expect(strict).toMatchObject({ diffPixels: 0, ok: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/settings.visual.test.ts
```

この例では差分を意図して作るため、`expectNoVisualDiff` が throw することまで assertion します。実プロジェクトでは差分がなければ `expectNoVisualDiff` をそのまま呼び、差分があれば CI artifact の `diffBuffer` を確認してから baseline 更新を判断します。

## 比較条件を安定させる

`threshold` は一画素の色差に対する感度で既定は `0.1`、`maxDiffRatio` は画面全体で許容する差分比率で既定は `0.005` です。`includeAA` の既定は false です。完全一致には `threshold: 0`、`includeAA: true`、`maxDiffRatio: 0` を使えますが、font や OS が異なると不安定になりやすくなります。

時刻、乱数、広告、進行中 animation のように画面の本質でない要素だけを mask または固定します。商品画像、error message、chart、主要な action を mask してはいけません。browser の navigation、network、font 配布、accessibility、実利用者の操作はこの library の対象外です。E2E と A11y test に分けて確認してください。公開 API は [リファレンス](./reference) を参照してください。
