// view-transitions.test.ts — Astro v5 View Transitions の lifecycle event を
// real browser なしで unit test する PoC。 setupAstroViewTransitionEnv が 4 event を
// 順次 dispatch するので、 page 内 listener (本物の page では `<script>` ブロックで
// document.addEventListener する) の挙動を fake 化して観測する。
//
// 公式 router 動作 (Astro v5 / node_modules/astro/dist/transitions/router.js) に準拠 ...
// preparation event は supportsViewTransitions に関係なく必ず dispatch される。
// 関連 e2e は tests/e2e/astro-view-transitions.spec.ts で real `astro dev` 経由で確認。

import { describe, expect, it } from 'vitest';
import { setupAstroViewTransitionEnv } from '@kiwa-lab/astro';

describe('Astro View Transitions PoC (unit)', () => {
  it('blog list -> blog/[slug] への nav で 4 event が順に dispatch される', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog/',
      toPath: '/blog/2026-06-30',
      navigationType: 'push',
    });
    const order: string[] = [];
    env.on('astro:before-preparation', (e) => {
      order.push(`${e.type}@${e.to.pathname}`);
    });
    env.on('astro:after-preparation', (e) => {
      order.push(e.type);
    });
    env.on('astro:before-swap', (e) => {
      order.push(`${e.type}@${e.to.pathname}`);
    });
    env.on('astro:after-swap', (e) => {
      order.push(e.type);
    });
    const result = await env.dispatchAll();
    expect(order).toEqual([
      'astro:before-preparation@/blog/2026-06-30',
      'astro:after-preparation',
      'astro:before-swap@/blog/2026-06-30',
      'astro:after-swap',
    ]);
    expect(result.cancelled).toBe(false);
    expect(result.swapCallCount).toBe(1);
  });

  it('header transition:name を持つ要素は from / to 両方の DOM で保持 (kept)', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog/',
      toPath: '/blog/2026-06-30',
      fromHtml:
        '<!doctype html><html><body><header></header><main></main></body></html>',
      toHtml:
        '<!doctype html><html><body><header></header><main></main></body></html>',
    });
    const diff = env.diffDom();
    expect(diff.kept).toEqual(['HEADER', 'MAIN']);
    expect(diff.removed).toEqual([]);
    expect(diff.added).toEqual([]);
  });

  it('blog list -> /404 nav で main → article への top-level tag 差分 (added)', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog/',
      toPath: '/missing',
      fromHtml:
        '<!doctype html><html><body><header></header><main></main></body></html>',
      toHtml:
        '<!doctype html><html><body><header></header><article></article></body></html>',
    });
    const diff = env.diffDom();
    expect(diff.removed).toEqual(['MAIN']);
    expect(diff.added).toEqual(['ARTICLE']);
    expect(diff.kept).toEqual(['HEADER']);
  });

  it('before-preparation で preventDefault すると nav が cancel + 後続 event は dispatch されない', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog/',
      toPath: '/blog/secret',
    });
    env.on('astro:before-preparation', (e) => {
      // 認可失敗を想定 ... real page では window.alert 等で警告し nav を停止
      e.preventDefault();
    });
    let beforeSwapSeen = false;
    env.on('astro:before-swap', () => {
      beforeSwapSeen = true;
    });
    const result = await env.dispatchAll();
    expect(result.cancelled).toBe(true);
    expect(beforeSwapSeen).toBe(false);
    expect(result.afterPreparation).toBeNull();
    expect(result.beforeSwap).toBeNull();
    expect(result.afterSwap).toBeNull();
    expect(result.swapCallCount).toBe(0);
  });

  it('supportsViewTransitions=false (older browser) でも 4 event は dispatch、 ただし viewTransition は undefined', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog/',
      toPath: '/blog/2026-06-15',
      supportsViewTransitions: false,
    });
    const trace: string[] = [];
    env.on('astro:before-preparation', (e) => {
      trace.push(e.type);
    });
    env.on('astro:after-preparation', (e) => {
      trace.push(e.type);
    });
    env.on('astro:before-swap', (e) => {
      trace.push(e.type);
    });
    env.on('astro:after-swap', (e) => {
      trace.push(e.type);
    });
    const result = await env.dispatchAll();
    expect(trace).toEqual([
      'astro:before-preparation',
      'astro:after-preparation',
      'astro:before-swap',
      'astro:after-swap',
    ]);
    // visual transition は無効 ... before-swap.viewTransition は undefined
    expect(result.beforeSwap?.viewTransition).toBeUndefined();
  });
});
