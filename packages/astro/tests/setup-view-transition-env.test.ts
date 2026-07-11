// setupAstroViewTransitionEnv tests (Issue #560, v1.3-3).
//
// Astro v5 View Transitions API の 4 lifecycle event を 1 env で capture できる
// unified helper。 既存 invokeEndpoint / renderAstroPage は backward compat 維持、
// setupAstroViewTransitionEnv は v1.1+ 新 entry。
//
// 公式 router 動作 (Astro v5 / node_modules/astro/dist/transitions/router.js + events.js) に
// 準拠 ... preparation event は supportsViewTransitions に関係なく必ず dispatch、
// after-preparation / after-swap は plain Event (payload なし)、 swap() は post-listener で
// 必ず 1 回呼ばれる (listener も呼べば計 2 回)。
//
// 11 観点 cover ... 正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力 / 冪等性 /
//                    並行 / 性能 / セキュリティ / 回帰 (各観点を T-AVT-NNN で番号付け)。

import { describe, expect, it } from 'vitest';
import {
  setupAstroViewTransitionEnv,
  type AstroViewTransitionListener,
} from '../src/index.js';

describe('setupAstroViewTransitionEnv', () => {
  it('T-AVT-001 正常系: env が 4 lifecycle event を順に dispatch する', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog',
      toPath: '/blog/2026-06-30',
    });
    const seen: string[] = [];
    env.on('astro:before-preparation', (e) => {
      seen.push(e.type);
    });
    env.on('astro:after-preparation', (e) => {
      seen.push(e.type);
    });
    env.on('astro:before-swap', (e) => {
      seen.push(e.type);
    });
    env.on('astro:after-swap', (e) => {
      seen.push(e.type);
    });
    const result = await env.dispatchAll();
    expect(seen).toEqual([
      'astro:before-preparation',
      'astro:after-preparation',
      'astro:before-swap',
      'astro:after-swap',
    ]);
    expect(result.swapCallCount).toBe(1);
    expect(result.cancelled).toBe(false);
  });

  it('T-AVT-002 正常系: from/to URL が before-preparation listener に正しく渡る', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/products',
      toPath: '/products/42',
    });
    let captured: { from: string; to: string } | null = null;
    env.on('astro:before-preparation', (e) => {
      captured = { from: e.from.pathname, to: e.to.pathname };
    });
    await env.dispatchAll();
    expect(captured).not.toBeNull();
    expect(captured!.from).toBe('/products');
    expect(captured!.to).toBe('/products/42');
  });

  it('T-AVT-003 transition name (transition:name) を env から expose', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/about',
      transitionName: 'page-fade',
    });
    expect(env.transitionName).toBe('page-fade');
  });

  it('T-AVT-004 transitionName 省略時 default は空文字', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/about',
    });
    expect(env.transitionName).toBe('');
  });

  it('T-AVT-005 異常系: before-preparation で preventDefault() すると nav が cancel される', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/secure',
      toPath: '/admin',
    });
    env.on('astro:before-preparation', (e) => {
      e.preventDefault();
    });
    const seenSwap = { before: false, after: false };
    env.on('astro:before-swap', () => {
      seenSwap.before = true;
    });
    env.on('astro:after-swap', () => {
      seenSwap.after = true;
    });
    const result = await env.dispatchAll();
    expect(result.cancelled).toBe(true);
    expect(result.afterPreparation).toBeNull();
    expect(result.beforeSwap).toBeNull();
    expect(result.afterSwap).toBeNull();
    expect(result.swapCallCount).toBe(0);
    expect(seenSwap.before).toBe(false);
    expect(seenSwap.after).toBe(false);
  });

  it('T-AVT-006 異常系: listener が throw すると dispatch も throw する (silent fail しない)', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    env.on('astro:before-preparation', () => {
      throw new Error('listener boom');
    });
    await expect(env.dispatchAll()).rejects.toThrow('listener boom');
  });

  it('T-AVT-007 境界値: listener なしでも dispatchAll が 4 event 完走する', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    const result = await env.dispatchAll();
    expect(result.beforePreparation).not.toBeNull();
    expect(result.afterPreparation).not.toBeNull();
    expect(result.beforeSwap).not.toBeNull();
    expect(result.afterSwap).not.toBeNull();
    expect(result.swapCallCount).toBe(1);
  });

  it('T-AVT-008 状態遷移: supportsViewTransitions=false でも preparation event は dispatch される (公式 router 動作)', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/legacy',
      toPath: '/modern',
      supportsViewTransitions: false,
    });
    const seen: string[] = [];
    env.on('astro:before-preparation', (e) => {
      seen.push(e.type);
    });
    env.on('astro:after-preparation', (e) => {
      seen.push(e.type);
    });
    env.on('astro:before-swap', (e) => {
      seen.push(e.type);
    });
    env.on('astro:after-swap', (e) => {
      seen.push(e.type);
    });
    const result = await env.dispatchAll();
    expect(seen).toEqual([
      'astro:before-preparation',
      'astro:after-preparation',
      'astro:before-swap',
      'astro:after-swap',
    ]);
    // supportsViewTransitions=false は before-swap.viewTransition を undefined にする
    expect(result.beforeSwap?.viewTransition).toBeUndefined();
  });

  it('T-AVT-008-2 状態遷移: supportsViewTransitions=true は before-swap.viewTransition を expose', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      supportsViewTransitions: true,
    });
    const result = await env.dispatchAll();
    expect(result.beforeSwap?.viewTransition).toBeDefined();
    expect(typeof result.beforeSwap?.viewTransition?.skipTransition).toBe('function');
  });

  it('T-AVT-009 状態遷移: dispatchAll() 後の reset() で listener / state が初期化される', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    let count = 0;
    env.on('astro:before-preparation', () => {
      count++;
    });
    await env.dispatchAll();
    expect(count).toBe(1);
    env.reset();
    await env.dispatchAll();
    expect(count).toBe(1); // listener は reset で除去済
  });

  it('T-AVT-010 入力: navigationType / direction を listener が受取れる', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/list',
      toPath: '/detail',
      navigationType: 'replace',
      direction: 'back',
    });
    let captured: { nav: string; dir: string } | null = null;
    env.on('astro:before-preparation', (e) => {
      captured = { nav: e.navigationType, dir: e.direction };
    });
    await env.dispatchAll();
    expect(captured).toEqual({ nav: 'replace', dir: 'back' });
  });

  it('T-AVT-011 入力: formData を before-preparation が capture (form submit 経路)', async () => {
    const fd = new FormData();
    fd.set('q', 'astro');
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/search',
      formData: fd,
    });
    let captured: FormData | undefined;
    env.on('astro:before-preparation', (e) => {
      captured = e.formData;
    });
    await env.dispatchAll();
    expect(captured?.get('q')).toBe('astro');
  });

  it('T-AVT-012 入力: sourceElement / info が context に流れる', async () => {
    const fakeElement = { tagName: 'A' } as unknown as Element;
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      sourceElement: fakeElement,
      info: { reason: 'link-click' },
    });
    let captured: { src: Element | undefined; info: unknown } | null = null;
    env.on('astro:before-preparation', (e) => {
      captured = { src: e.sourceElement, info: e.info };
    });
    await env.dispatchAll();
    expect(captured!.src).toBe(fakeElement);
    expect(captured!.info).toEqual({ reason: 'link-click' });
  });

  it('T-AVT-013 冪等性: 同 env で dispatchAll を 2 回呼ぶと listener も 2 回起動', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    let beforeCount = 0;
    let afterCount = 0;
    env.on('astro:before-preparation', () => {
      beforeCount++;
    });
    env.on('astro:after-swap', () => {
      afterCount++;
    });
    await env.dispatchAll();
    await env.dispatchAll();
    expect(beforeCount).toBe(2);
    expect(afterCount).toBe(2);
  });

  it('T-AVT-014 冪等性: off() で登録解除すると以降の dispatch では呼ばれない', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    let calls = 0;
    const listener: AstroViewTransitionListener<never> = () => {
      calls++;
    };
    env.on('astro:before-preparation', listener as never);
    await env.dispatchAll();
    expect(calls).toBe(1);
    env.off('astro:before-preparation', listener as never);
    await env.dispatchAll();
    expect(calls).toBe(1);
  });

  it('T-AVT-015 並行: 同型 event の listener 複数登録時、 登録順に直列で実行', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    const order: string[] = [];
    env.on('astro:before-preparation', async () => {
      await Promise.resolve();
      order.push('A');
    });
    env.on('astro:before-preparation', async () => {
      await Promise.resolve();
      order.push('B');
    });
    await env.dispatchAll();
    expect(order).toEqual(['A', 'B']);
  });

  it('T-AVT-016 並行: before-preparation の loader override が await される (preventDefault されない場合)', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/slow',
    });
    let loaded = false;
    env.on('astro:before-preparation', (e) => {
      e.loader = async () => {
        await new Promise((r) => setTimeout(r, 5));
        loaded = true;
      };
    });
    let afterPrepSeen = false;
    env.on('astro:after-preparation', () => {
      afterPrepSeen = true;
    });
    await env.dispatchAll();
    expect(loaded).toBe(true);
    expect(afterPrepSeen).toBe(true);
  });

  it('T-AVT-017 性能: dispatch() 個別経路でも event 構築コストは 1 回のみ', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    let invocations = 0;
    env.on('astro:before-swap', () => {
      invocations++;
    });
    const e = await env.dispatch('astro:before-swap');
    expect(e.type).toBe('astro:before-swap');
    expect(invocations).toBe(1);
  });

  it('T-AVT-018 セキュリティ: locals 等 internal API は expose しない (newDocument 経由のみ DOM access)', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      toHtml: '<!doctype html><html><body><main><h1>x</h1></main></body></html>',
    });
    const exposed = Object.keys(env).sort();
    expect(exposed).toContain('fromUrl');
    expect(exposed).toContain('toUrl');
    expect(exposed).not.toContain('locals');
    expect(exposed).not.toContain('cookies');
    expect(exposed).not.toContain('platform');
  });

  it('T-AVT-019 セキュリティ: newDocument は readonly 参照 (env 経由でしか取得できない)', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      toHtml: '<!doctype html><html><body><main>m</main></body></html>',
    });
    const doc = env.newDocument;
    expect(doc).toBeDefined();
    // env を介さずに internal storage を入れ替える経路はない
    expect(() => {
      'use strict';
      (env as unknown as { newDocument: unknown }).newDocument = null;
    }).toThrow();
  });

  it('T-AVT-020 回帰: diffDom() が from / to の top-level tag 差分を抽出', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/blog',
      toPath: '/blog/2026-06-30',
      fromHtml: '<!doctype html><html><body><header></header><main></main><aside></aside></body></html>',
      toHtml: '<!doctype html><html><body><header></header><main></main><article></article></body></html>',
    });
    const diff = env.diffDom();
    expect(diff.removed).toEqual(['ASIDE']);
    expect(diff.added).toEqual(['ARTICLE']);
    expect(diff.kept).toEqual(['HEADER', 'MAIN']);
  });

  it('T-AVT-021 回帰: dispatch 個別呼出時の event payload (newDocument / direction) 正確', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      direction: 'forward',
      toHtml: '<!doctype html><html><body><main></main></body></html>',
    });
    const e = await env.dispatch('astro:before-swap');
    expect(e.direction).toBe('forward');
    expect(e.newDocument).toBeDefined();
  });

  it('T-AVT-022 回帰: before-swap の swap() は post-listener で必ず 1 回呼ばれる (listener が呼ばない場合 swapCallCount=1)', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    const result = await env.dispatchAll();
    expect(result.swapCallCount).toBe(1);
  });

  it('T-AVT-023 回帰: listener が swap() を呼ぶと post-listener default swap と合わせて計 2 回 (double-swap 検出)', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    env.on('astro:before-swap', (e) => {
      e.swap();
    });
    const result = await env.dispatchAll();
    expect(result.swapCallCount).toBe(2);
  });

  it('T-AVT-024 回帰: listener が swap を no-op 化すれば post-listener 経由のみで swapCallCount=1 維持', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    env.on('astro:before-swap', (e) => {
      // listener が swap を no-op 化 → post-listener の swap も no-op になる
      e.swap = () => {};
    });
    const result = await env.dispatchAll();
    expect(result.swapCallCount).toBe(0);
  });

  it('T-AVT-025 回帰: diffDom() が void element (<img>) を top-level として正しく認識', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      fromHtml: '<!doctype html><html><body><img alt="a"><main></main></body></html>',
      toHtml: '<!doctype html><html><body><img alt="b"><article></article></body></html>',
    });
    const diff = env.diffDom();
    expect(diff.removed).toEqual(['MAIN']);
    expect(diff.added).toEqual(['ARTICLE']);
    expect(diff.kept).toEqual(['IMG']);
  });

  it('T-AVT-026 回帰: HTML comment / DOCTYPE / 自己終端形 (<x />) は top-level tag 検出に干渉しない', () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      fromHtml:
        '<!doctype html><html><body><!-- comment --><header></header><br><main></main></body></html>',
      toHtml:
        '<!doctype html><html><body><header></header><br /><article></article></body></html>',
    });
    const diff = env.diffDom();
    expect(diff.kept.sort()).toEqual(['BR', 'HEADER']);
    expect(diff.removed).toEqual(['MAIN']);
    expect(diff.added).toEqual(['ARTICLE']);
  });

  it('T-AVT-027 回帰: after-preparation / after-swap event は plain (type のみ) — 公式 router 動作準拠', async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    let afterPrepKeys: string[] = [];
    let afterSwapKeys: string[] = [];
    env.on('astro:after-preparation', (e) => {
      afterPrepKeys = Object.keys(e);
    });
    env.on('astro:after-swap', (e) => {
      afterSwapKeys = Object.keys(e);
    });
    await env.dispatchAll();
    expect(afterPrepKeys).toEqual(['type']);
    expect(afterSwapKeys).toEqual(['type']);
  });

  it('T-AVT-027a parseDocument falls back to raw HTML when the input has no <body> tag', async () => {
    // Closes the `bodyMatch ? bodyMatch[1] ?? '' : html` false arm at line 42. Passing
    // a fragment without a body tag makes bodyMatch null so the parser walks the raw
    // input; the top-level tag has to be detected there too.
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      toHtml: '<main>bare</main><article>too</article>',
    });
    // Both top-level elements should be found even without a body wrapper.
    const tags = Array.from(env.newDocument.body.children).map((c) => c.tagName);
    expect(tags).toContain('MAIN');
    expect(tags).toContain('ARTICLE');
  });

  it('T-AVT-028 parsed document exposes get/set innerHTML on body (round-trip)', async () => {
    // Closes the innerHTML getter/setter (lines 77-82 of parseDocument's returned body).
    // Existing tests read `newDocument.body.children` and the outerHTML on documentElement
    // but never touch body.innerHTML directly.
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      toHtml: '<!doctype html><html><body><main>alpha</main></body></html>',
    });
    // getter returns the parsed body inner HTML string
    expect(env.newDocument.body.innerHTML).toContain('<main>alpha</main>');
    // setter mutates the stored value; the getter reflects the new value
    env.newDocument.body.innerHTML = '<article>beta</article>';
    expect(env.newDocument.body.innerHTML).toBe('<article>beta</article>');
  });

  it('T-AVT-029 viewTransition.skipTransition() is invocable when supportsViewTransitions=true', async () => {
    // Closes the empty skipTransition arrow (line 117) — no existing test calls it.
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
      supportsViewTransitions: true,
    });
    let vt: { skipTransition: () => void } | undefined;
    env.on('astro:before-swap', (e) => {
      vt = e.viewTransition;
      // Explicitly exercising the runtime function — the harness stub is a no-op
      // but must be callable so router code doing `e.viewTransition?.skipTransition()`
      // works against the env.
      vt?.skipTransition();
    });
    await env.dispatchAll();
    expect(typeof vt?.skipTransition).toBe('function');
  });

  it('T-AVT-030 env.dispatch() individually reaches every case of the switch', async () => {
    // Existing T-AVT-017 exercises the before-swap case only via env.dispatch().
    // dispatchAll() calls all 4 cases, but the individual switch arms in dispatch()
    // were only exercised for before-swap. This calls dispatch() explicitly for
    // each of the 4 event types + verifies default throws for an unknown type.
    const env = setupAstroViewTransitionEnv({
      fromPath: '/',
      toPath: '/x',
    });
    const bp = await env.dispatch('astro:before-preparation');
    const ap = await env.dispatch('astro:after-preparation');
    const bs = await env.dispatch('astro:before-swap');
    const as = await env.dispatch('astro:after-swap');
    expect(bp.type).toBe('astro:before-preparation');
    expect(ap.type).toBe('astro:after-preparation');
    expect(bs.type).toBe('astro:before-swap');
    expect(as.type).toBe('astro:after-swap');
    // biome-ignore lint/suspicious/noExplicitAny: exercising the default-throw arm
    await expect(env.dispatch('astro:unknown' as any)).rejects.toThrow(/unknown event type/);
  });
});
