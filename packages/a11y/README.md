# @kiwa/a11y

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the accessibility surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the accessibility surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Accessibility (a11y) test adapter for the [kiwa](https://github.com/cardene777/kiwa) framework. Thin wrapper around [axe-core](https://github.com/dequelabs/axe-core) that plugs into Vitest + jsdom and Playwright page contexts.

## Install

```bash
pnpm add -D @kiwa/a11y axe-core
# Playwright も使う場合
pnpm add -D @playwright/test
```

`axe-core` は peer/optional 扱い、 必ず一緒に install してください。

## Quickstart — jsdom + Vitest

```ts
import { describe, expect, it } from 'vitest';
import { runAxe, expectNoViolations } from '@kiwa/a11y';

describe('Counter component', () => {
  it('has no critical / serious a11y violations', async () => {
    document.body.innerHTML = '<button aria-label="increment">+</button>';

    const results = await runAxe();
    expectNoViolations(results, expect, { maxImpact: 'serious' });
  });
});
```

`vitest.config.ts` で `environment: 'jsdom'` を指定すること。

## Quickstart — Playwright page

`runAxe` は jsdom 専用です。 Playwright page を audit するときは page 内で `axe.run()` を直接 evaluate して結果を取得し、 `reportViolations` で集計します。

```ts
import { test, expect } from '@playwright/test';
import { reportViolations } from '@kiwa/a11y';

test('home is accessible', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' });
  const results = await page.evaluate(async () => await (window as any).axe.run());

  const report = reportViolations(results, { maxImpact: 'serious' });
  expect(report.blocking, report.summary).toEqual([]);
});
```

## API

| 関数 | 用途 |
|---|---|
| `runAxe(opts?)` | jsdom 環境で `axe.run()` 実行、 `AxeResults` を返す |
| `reportViolations(results, { maxImpact })` | `maxImpact` (minor / moderate / serious / critical) 以上の violation を blocking として抽出、 サマリ文字列を生成 |
| `expectNoViolations(results, expect, { maxImpact })` | blocking 0 件を `expect(...).toBe(0)` で assert、 失敗時に詳細メッセージ throw |

### `AuditOptions`

```ts
interface AuditOptions {
  context?: Element | Document | string;   // default: document
  runOptions?: Parameters<typeof axe.run>[1];
  maxImpact?: 'minor' | 'moderate' | 'serious' | 'critical';  // default: 'minor'
}
```

## Impact levels

axe-core の impact 4 段階 (minor < moderate < serious < critical) と一致。 `maxImpact: 'serious'` は serious と critical を blocking 扱い。

## ライセンス

MIT
