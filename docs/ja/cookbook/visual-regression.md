# `@kiwa-lab/visual` で visual regression

> [🇬🇧 English](../../en/cookbook/visual-regression.md) • [🇯🇵 日本語](./visual-regression.md)

pixelmatch + pngjs によるピクセル単位 PNG diff。 commit された baseline と一致するか assert、 不一致時に diff PNG を吐き出す。

## こんなときに使う

- component / page は明示変更するまで見た目同一であってほしい
- reviewer に一目で違いがわかる diff 画像を PR に添付したい
- 既に Playwright / Vitest を使っていて、 別の visual testing platform を増やしたくない

## インストール

```bash
pnpm add -D @kiwa-lab/visual pixelmatch pngjs
```

`pixelmatch` と `pngjs` は peer/optional、 必ず一緒に install する。

## Scenario A — Playwright screenshot vs baseline PNG

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { expectNoVisualDiff } from '@kiwa-lab/visual';

const fixtureDir = join(__dirname, 'fixtures');

test('header と baseline 一致', async ({ page }) => {
  await page.goto('/');
  const actual = await page.locator('header').screenshot();
  const baseline = readFileSync(join(fixtureDir, 'header.baseline.png'));

  expectNoVisualDiff({ baseline, actual }, expect, {
    threshold: 0.1,
    maxDiffPixels: 50,
    diffOutputPath: join(fixtureDir, 'header.diff.png'),
  });
});
```

`threshold` は pixelmatch に渡る (0–1、 低いほど厳しい)。 `maxDiffPixels` は kiwa 側の hard limit、 超過すると diff PNG path を message に含めて throw する。

## Scenario B — Vitest + jsdom で canvas / SVG snapshot

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { comparePngBuffers } from '@kiwa-lab/visual';

test('chart 描画と baseline 一致', () => {
  const baseline = readFileSync('tests/fixtures/chart.baseline.png');
  const actual = readFileSync('tests/fixtures/chart.actual.png');

  const result = comparePngBuffers(baseline, actual, { threshold: 0.05 });

  expect(result.diffPixels).toBeLessThan(10);
});
```

`comparePngBuffers` は diff 統計を返すので、 % 差分 / 関心領域 mask 等を独自に assert できる。

## baseline 更新ワークフロー

1. 初回 — `actual.png` 生成 → `baseline.png` として test 隣に commit
2. 回帰検出 — 生成された diff PNG を visual で確認、 意図変更か判定
3. 受入 — `baseline.png` を新 `actual.png` で上書き → 本変更の PR と同 commit に含める

baseline 多数の repo は git LFS or 専用 baseline branch で履歴肥大を抑える。

## anti-aliasing の罠

macOS vs Linux CI の AA 差分が false positive の最大要因。 防御 2 つ:

- `includeAA: false` (default) — pixelmatch が AA pixel を既に skip
- 描画 engine を統一 — Playwright Chromium が visual diff 安定、 Firefox/WebKit より recommend

## 関連

- Package: [`@kiwa-lab/visual`](../../../packages/visual/README.md)
- a11y cookbook: [a11y-axe.md](./a11y-axe.md)
- pixelmatch docs: https://github.com/mapbox/pixelmatch
