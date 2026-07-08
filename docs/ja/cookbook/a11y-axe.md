# `@kiwa/a11y` で a11y 監査する

> [🇬🇧 English](../../en/cookbook/a11y-axe.md) • [🇯🇵 日本語](./a11y-axe.md)

axe-core を kiwa に統合した accessibility 監査 adapter。 Vitest + jsdom もしくは Playwright page に対して axe を走らせて、 impact 閾値で blocking 判定する。

## こんなときに使う

- component test で `critical` / `serious` の WCAG 違反を確実に落としたい
- E2E flow の auth + nav 後の本物 page を audit したい
- CI に「blocking 0 件」 の決定的 gate を入れたい (「見た目 OK そう」 ではなく)

## インストール

```bash
pnpm add -D @kiwa/a11y axe-core
```

`axe-core` は peer/optional 扱い、 必ず一緒に install する。

## Scenario A — Vitest + jsdom

`runAxe()` は global `document` を再利用する。 `vitest.config.ts` で `environment: 'jsdom'` 指定が必須。

```ts
import { describe, expect, it } from 'vitest';
import { runAxe, expectNoViolations } from '@kiwa/a11y';

describe('LoginForm a11y', () => {
  it('render 後に serious / critical 違反 0 件', async () => {
    document.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input id="email" type="email" />
        <button type="submit" aria-label="Sign in">→</button>
      </form>
    `;

    const results = await runAxe();
    expectNoViolations(results, expect, { maxImpact: 'serious' });
  });
});
```

閾値を超えた違反があれば axe の詳細メッセージ (rule id / help / 該当 node) と一緒に throw する。

## Scenario B — Playwright page

`runAxe()` は jsdom 専用。 Playwright では page に `axe.min.js` を inject、 client 側で `axe.run()` を実行、 結果を `reportViolations()` に渡す経路。

```ts
import { test, expect } from '@playwright/test';
import { reportViolations } from '@kiwa/a11y';

test('home page は accessible', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' });
  const results = await page.evaluate(async () => {
    // @ts-expect-error script tag で window.axe が読込まれている
    return await window.axe.run();
  });

  const report = reportViolations(results, { maxImpact: 'serious' });
  expect(report.blocking, report.summary).toEqual([]);
});
```

CSP 厳しい環境では `axe.min.js` を `public/` に vendoring して `addScriptTag({ path: 'public/axe.min.js' })` 経由で読込む。

## 環境別の閾値

axe-core の impact は 4 段階 (`minor` < `moderate` < `serious` < `critical`)。 CI は厳しめ、 local は緩めに切替える。

```ts
const maxImpact = process.env.CI ? 'moderate' : 'serious';
expectNoViolations(results, expect, { maxImpact });
```

## 特定 rule の include / exclude

`runAxe()` は `runOptions` を `axe.run()` にそのまま forward する。

```ts
const results = await runAxe({
  runOptions: {
    rules: {
      'color-contrast': { enabled: true },
      'region': { enabled: false }, // legacy template、 本 PR では fix しない
    },
  },
});
```

## 関連

- Package: [`@kiwa/a11y`](../../../packages/a11y/README.md)
- visual regression cookbook: [visual-regression.md](./visual-regression.md)
- axe-core rule catalogue: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
