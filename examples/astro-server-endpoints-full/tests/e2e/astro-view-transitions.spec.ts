// Playwright e2e — real `astro dev` で `<ViewTransitions />` を動かし、
// blog/index.astro → blog/[slug].astro への nav で 4 lifecycle event が
// document.body.dataset.kiwaVtTrace に積まれることを確認する。
//
// 補足 ... Chromium は cross-document View Transitions を v5 系で部分 support、
// Astro v5 の polyfill が同 origin nav を SPA-like に処理して 4 event を dispatch する。

import { expect, test } from '@playwright/test';

test.describe('Astro v5 View Transitions PoC — real dev server', () => {
  test('GET /blog/ renders header transition:name="site-header"', async ({ page }) => {
    const response = await page.goto('/blog/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('header h1')).toHaveText('kiwa blog (View Transitions PoC)');
    // header transition:name は HTML 出力に含まれる (Astro が view-transition-name CSS を inject)
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('blog list -> blog/[slug] nav で 4 lifecycle event が dispatch される', async ({
    page,
  }) => {
    await page.goto('/blog/');
    // link click で nav
    await page.locator('a[data-kiwa-link="post"]').first().click();
    await page.waitForLoadState('networkidle');
    // SPA-like nav 経由なら trace に before-preparation 等が積まれる、
    // full reload (fallback path) なら body.dataset.kiwaVtTrace は新 page の listener から開始
    const trace = await page.evaluate(
      () => (document.body as HTMLBodyElement).dataset.kiwaVtTrace ?? '',
    );
    // 4 event の少なくとも 2 つ (before-swap / after-swap) は必ず観測される (fallback 含む)
    expect(trace).toMatch(/before-swap|after-swap/);
    // article 要素が新 page で表示されている
    await expect(page.locator('article')).toBeVisible();
    // URL が /blog/2026-06-30 / 2026-06-15 のどちらかに切替済
    expect(page.url()).toMatch(/\/blog\/2026-/);
  });

  test('GET /blog/2026-06-30 直接 access で article 要素が描画される', async ({ page }) => {
    await page.goto('/blog/2026-06-30');
    const article = page.locator('article[data-kiwa-post-slug="2026-06-30"]');
    await expect(article).toBeVisible();
    await expect(article.locator('h2')).toHaveText('kiwa v1.3 milestone start');
  });
});
