# @kiwa-lab/visual

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the visual regression surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the visual regression surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Visual regression test adapter for the [kiwa](https://github.com/cardene777/kiwa) framework. Pixel-level PNG diff backed by [pixelmatch](https://github.com/mapbox/pixelmatch) + [pngjs](https://github.com/lukeapage/pngjs).

## Install

```bash
pnpm add -D @kiwa-lab/visual pixelmatch pngjs
```

`pixelmatch` と `pngjs` は peer/optional 扱い、 必ず一緒に install してください。

## Quickstart

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { expectNoVisualDiff } from '@kiwa-lab/visual';

test('header snapshot matches', () => {
  const baseline = readFileSync('tests/fixtures/header.baseline.png');
  const actual = readFileSync('tests/fixtures/header.actual.png');

  expectNoVisualDiff({ baseline, actual }, expect, {
    threshold: 0.1,           // pixelmatch threshold (0..1)
    maxDiffPixels: 50,        // 50 ピクセル超でテスト失敗
    diffOutputPath: 'tests/fixtures/header.diff.png',  // 差分 PNG を書出 (任意)
  });
});
```

## API

| 関数 | 用途 |
|---|---|
| `comparePngBuffers(baseline, actual, options?)` | 2 枚の PNG Buffer を比較し `CompareResult` ({ diffPixels, totalPixels, diffPng }) を返す |
| `expectNoVisualDiff({ baseline, actual }, expect, options)` | `maxDiffPixels` 以下なら PASS、 超過なら詳細メッセージ throw + diff PNG 書出 (`diffOutputPath` 指定時) |

### `CompareOptions`

```ts
interface CompareOptions {
  threshold?: number;       // pixelmatch 互換 (default 0.1)
  includeAA?: boolean;      // anti-alias を diff に含めるか (default false)
}
```

### `CompareResult`

```ts
interface CompareResult {
  diffPixels: number;
  totalPixels: number;
  width: number;
  height: number;
  diffPng: Buffer;          // 差分強調 PNG (赤色オーバーレイ)
}
```

## ベースライン更新ワークフロー

1. 初回 — `actual.png` を生成 → `baseline.png` として commit
2. 回帰検出時 — diff PNG を visual で確認、 意図した変更なら `actual.png` を `baseline.png` に上書きして commit

PNG snapshot は git LFS に乗せるか、 専用 baseline branch を切ると履歴肥大を抑えられる。

## ライセンス

MIT

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/ai-realtime/visual/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/ai-realtime/visual/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/ai-realtime/visual/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/ai-realtime/visual/reference)

編集元は [docs/libraries/ai-realtime/visual](../../docs/libraries/ai-realtime/visual/) です。
<!-- kiwa-docs:end -->
