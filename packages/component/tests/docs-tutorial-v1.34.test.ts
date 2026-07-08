/**
 * v1.34-5 docs 補強 (Issue #1052 / CAR-788) — tutorial 67-69 code snippet validation.
 *
 * `docs/tutorials/67-rsc-streaming-ssr.md` /
 * `docs/tutorials/68-server-action-optimistic.md` /
 * `docs/tutorials/69-storybook-8-mdx.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * v1.23 → v1.34 で 12 milestone 連続 snippet validation streak を延伸。
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  addHandler,
  applyOptimisticUpdate,
  assertAnimation,
  beginRscRender,
  collectFidelityCoverage,
  completeRscRender,
  completeSelectiveHydration,
  createNode,
  createStoryRegistry,
  enableProgressiveEnhancement,
  enterSuspenseBoundary,
  finishElementTransition,
  fireEvent,
  hashMarkup,
  renderMarkup,
  markFormStatusPending,
  markSuspensePending,
  resolveFormAction,
  startElementTransition,
  startFormActionSession,
  startProgressiveHydration,
  startRscHarness,
  startStreamingSsr,
  startViewTransitionSession,
  streamHtmlChunk,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 67 — RSC streaming SSR (RSC harness + streaming SSR + view transitions)
// ---------------------------------------------------------------------------

describe('tutorial 67 — startRscHarness', () => {
  it('constructs a session with defaults filled in (tutorial: defaults snippet)', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });

    expect(session.state).toBe('idle');
    expect(session.chunks).toEqual([]);
    expect(session.suspenseFallback).toBeNull();
    expect(session.error).toBeNull();
  });

  it('rejects an empty component id (tutorial: empty guard snippet)', () => {
    expect(() =>
      startRscHarness({
        target: 'playwright-ct',
        componentId: '',
      }),
    ).toThrow(/componentId must not be empty/);
  });
});

describe('tutorial 67 — streaming ladder', () => {
  it('advances idle → rendering → streaming with per-chunk metadata (tutorial: ladder snippet)', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });

    const begin = beginRscRender(session);
    const chunk1 = streamHtmlChunk(session, '<h1>Hello</h1>');
    const chunk2 = streamHtmlChunk(session, '<p>World</p>');

    expect(begin.state).toBe('rendering');
    expect(begin.neutralEvent).toBe('rsc.render_started');
    expect(chunk1.state).toBe('streaming');
    expect(chunk1.metadata.chunkIndex).toBe(0);
    expect(chunk1.metadata.bytes).toBe(14);
    expect(chunk2.metadata.chunkIndex).toBe(1);
    expect(session.chunks).toEqual(['<h1>Hello</h1>', '<p>World</p>']);
  });

  it('rejects an empty chunk (tutorial: empty chunk snippet)', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });
    beginRscRender(session);
    expect(() => streamHtmlChunk(session, '')).toThrow(/chunk must not be empty/);
  });
});

describe('tutorial 67 — Suspense boundary + completion', () => {
  it('advances rendering → suspended → streaming → completed with resolved chunks (tutorial: suspense snippet)', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
      suspenseFallback: '<div data-suspense="pending">loading</div>',
    });

    beginRscRender(session);
    const boundary = enterSuspenseBoundary(session);
    streamHtmlChunk(session, '<article>Hello</article>');
    const done = completeRscRender(session);

    expect(boundary.state).toBe('suspended');
    expect(boundary.neutralEvent).toBe('rsc.suspense_boundary');
    expect(boundary.metadata.fallback).toBe('<div data-suspense="pending">loading</div>');
    expect(done.state).toBe('completed');
    expect(done.neutralEvent).toBe('rsc.render_completed');
    expect(done.metadata.chunkCount).toBe(1);
    expect(done.metadata.html).toBe('<article>Hello</article>');
  });
});

describe('tutorial 67 — selective hydration ladder', () => {
  it('tracks pending → hydrating → hydrated per boundary (tutorial: selective hydration snippet)', () => {
    const session = startStreamingSsr({
      target: 'playwright-ct',
      routeId: 'route-articles',
    });

    markSuspensePending(session, 'boundary-header');
    markSuspensePending(session, 'boundary-body');
    startProgressiveHydration(session, 'boundary-header');
    const hydrated = completeSelectiveHydration(session, 'boundary-header');

    expect(hydrated.state).toBe('selective-hydrated');
    expect(hydrated.neutralEvent).toBe('ssr.selective_hydration_completed');
    expect(hydrated.metadata.hydratedCount).toBe(1);
    expect(hydrated.metadata.remainingPending).toBe(1);
    expect(session.pendingBoundaries.has('boundary-body')).toBe(true);
    expect(session.hydratedBoundaries.has('boundary-header')).toBe(true);
  });

  it('rejects hydration on an unknown boundary (tutorial: unknown boundary guard snippet)', () => {
    const session = startStreamingSsr({
      target: 'playwright-ct',
      routeId: 'route-articles',
    });

    expect(() => startProgressiveHydration(session, 'boundary-unknown')).toThrow(/is not pending/);
  });
});

describe('tutorial 67 — view element transition + animation assertion', () => {
  it('advances idle → element-transitioning → finished (tutorial: element transition snippet)', () => {
    const session = startViewTransitionSession({
      target: 'playwright-ct',
      transitionId: 'article-to-detail',
    });

    startElementTransition(session, {
      elementId: 'article-cover',
      from: '/articles',
      to: '/articles/hello',
    });
    const asserted = assertAnimation(session, {
      assertionId: 'article-cover-fade',
      durationMs: 320,
      easing: 'ease-out',
    });
    const finished = finishElementTransition(session, 'article-cover');

    expect(session.activeElements.size).toBe(0);
    expect(asserted.state).toBe('asserted');
    expect(asserted.neutralEvent).toBe('transition.animation_asserted');
    expect(asserted.metadata.durationMs).toBe(320);
    expect(asserted.metadata.easing).toBe('ease-out');
    expect(finished.state).toBe('finished');
    expect(finished.neutralEvent).toBe('transition.element_finished');
  });

  it('rejects a finish call on an inactive element (tutorial: inactive element guard snippet)', () => {
    const session = startViewTransitionSession({
      target: 'playwright-ct',
      transitionId: 'article-to-detail',
    });

    expect(() => finishElementTransition(session, 'article-cover')).toThrow(/is not active/);
  });
});

describe('tutorial 67 — fidelity coverage (component)', () => {
  it('every target covers every axis with 4 neutral events per axis (tutorial: fidelity snippet)', () => {
    const coverage = collectFidelityCoverage(['storybook8', 'playwright-ct', 'chromatic']);

    // v1.34 = 4 axis (12 rows) / v1.49 pair 3 段拡張 = 6 axis (18 rows)、
    // 拡張は additive のため v1.34 snippet の意味論は 4 axis 部分集合の存在確認に変更。
    expect(coverage.rows).toHaveLength(18);
    expect(coverage.axes.slice(0, 4)).toEqual([
      'rsc-harness',
      'streaming-ssr',
      'view-transitions',
      'form-action-advanced',
    ]);

    const rscRows = coverage.rows.filter((r) => r.axis === 'rsc-harness');
    expect(rscRows).toHaveLength(3);
    for (const row of rscRows) {
      expect(row.neutralEvents).toEqual([
        'rsc.render_started',
        'rsc.suspense_boundary',
        'rsc.html_chunk_streamed',
        'rsc.render_completed',
      ]);
    }
  });
});

// ---------------------------------------------------------------------------
// Tutorial 68 — Server Action + optimistic UI (form-action-advanced only, server side lives in nextjs package)
// ---------------------------------------------------------------------------

interface SubscribeForm extends Record<string, unknown> {
  email: string;
  optIn: boolean;
  subscribed?: boolean;
}

interface LikeForm extends Record<string, unknown> {
  postId: string;
  likeCount: number;
}

describe('tutorial 68 — startFormActionSession', () => {
  it('constructs a session with the initial form copied in (tutorial: form defaults snippet)', () => {
    const session = startFormActionSession<SubscribeForm>({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { email: '', optIn: false },
    });

    expect(session.state).toBe('idle');
    expect(session.form).toEqual({ email: '', optIn: false });
    expect(session.optimisticPatches).toEqual([]);
    expect(session.enhanced).toBe(false);
    expect(session.error).toBeNull();
  });

  it('rejects an empty form id (tutorial: empty formId guard snippet)', () => {
    expect(() =>
      startFormActionSession({
        target: 'playwright-ct',
        formId: '',
        initial: {},
      }),
    ).toThrow(/formId must not be empty/);
  });
});

describe('tutorial 68 — pending → optimistic ladder', () => {
  it('advances idle → pending → optimistic with the patch applied (tutorial: optimistic snippet)', () => {
    const session = startFormActionSession<LikeForm>({
      target: 'playwright-ct',
      formId: 'like-form',
      initial: { postId: 'post-1', likeCount: 42 },
    });

    const pending = markFormStatusPending(session, 'like-button');
    const optimistic = applyOptimisticUpdate(session, { likeCount: 43 });

    expect(pending.state).toBe('pending');
    expect(pending.neutralEvent).toBe('form.status_pending');
    expect(pending.metadata.submitter).toBe('like-button');
    expect(optimistic.state).toBe('optimistic');
    expect(optimistic.neutralEvent).toBe('form.optimistic_applied');
    expect(optimistic.metadata.patchKeys).toBe('likeCount');
    expect(optimistic.metadata.patchCount).toBe(1);
    expect(session.form.likeCount).toBe(43);
    expect(session.optimisticPatches).toEqual([{ likeCount: 43 }]);
  });

  it('rejects a double pending mark (tutorial: double pending guard snippet)', () => {
    const session = startFormActionSession({
      target: 'playwright-ct',
      formId: 'like-form',
      initial: { likeCount: 42 },
    });
    markFormStatusPending(session, 'like-button');
    expect(() => markFormStatusPending(session, 'like-button')).toThrow(/already pending/);
  });
});

describe('tutorial 68 — enhance + resolve', () => {
  it('advances pending → enhanced → resolved with the Server Action return value merged (tutorial: resolve snippet)', () => {
    const session = startFormActionSession<SubscribeForm>({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { email: 'user@example.com', optIn: false, subscribed: false },
    });

    markFormStatusPending(session, 'subscribe-button');
    const enhanced = enableProgressiveEnhancement(session, {
      method: 'post',
      actionUrl: '/api/subscribe',
    });
    const resolved = resolveFormAction(session, { subscribed: true });

    expect(enhanced.state).toBe('enhanced');
    expect(enhanced.neutralEvent).toBe('form.progressive_enhanced');
    expect(enhanced.metadata.actionUrl).toBe('/api/subscribe');
    expect(enhanced.metadata.method).toBe('post');
    expect(resolved.state).toBe('resolved');
    expect(resolved.neutralEvent).toBe('form.action_resolved');
    expect(resolved.metadata.enhanced).toBe(true);
    expect(session.form.subscribed).toBe(true);
  });

  it('rejects a resolve on an idle session (tutorial: resolve guard snippet)', () => {
    const session = startFormActionSession({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { subscribed: false },
    });
    expect(() => resolveFormAction(session, { subscribed: true })).toThrow(/was not submitted/);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 69 — Storybook 8 MDX (story registry + mount + play + a11y + coverage)
// ---------------------------------------------------------------------------

interface ButtonArgs extends Record<string, unknown> {
  label: string;
  variant: 'primary' | 'secondary';
}

interface CardArgs extends Record<string, unknown> {
  title: string;
  body: string;
}

interface CounterArgs extends Record<string, unknown> {
  initial: number;
}

describe('tutorial 69 — createStoryRegistry', () => {
  it('registers a meta + stories and returns per-story entries (tutorial: registry snippet)', () => {
    const registry = createStoryRegistry();

    registry.register<ButtonArgs>({
      title: 'Components/Button',
      render: (args) => createNode('button', { text: args.label }),
      args: { variant: 'primary' },
      stories: {
        Primary: { args: { label: 'Click me' } },
        Secondary: { args: { label: 'Nope', variant: 'secondary' } },
      },
    });

    const entries = registry.list();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.id)).toEqual([
      'components-button--primary',
      'components-button--secondary',
    ]);

    const primary = registry.get('Components/Button', 'Primary');
    expect(primary.args).toEqual({ label: 'Click me', variant: 'primary' });

    const secondary = registry.get('Components/Button', 'Secondary');
    expect(secondary.args).toEqual({ label: 'Nope', variant: 'secondary' });
  });

  it('throws when the story does not exist (tutorial: no silent fallback snippet)', () => {
    const registry = createStoryRegistry();
    expect(() => registry.get('Missing', 'Story')).toThrow(/no entry for missing--story/);
  });
});

describe('tutorial 69 — mount + hashMarkup', () => {
  it('mounts the story into a canvas + queryable (tutorial: mount snippet)', () => {
    const registry = createStoryRegistry();
    registry.register<CardArgs>({
      title: 'Layout/Card',
      render: (args) =>
        createNode('article', {
          children: [
            createNode('h2', { text: args.title }),
            createNode('p', { text: args.body }),
          ],
        }),
      stories: {
        Default: { args: { title: 'Hello', body: 'World' } },
      },
    });

    const { canvas, entry } = registry.mount('Layout/Card', 'Default');
    const [h2] = canvas.querySelectorAll('h2');
    const [p] = canvas.querySelectorAll('p');

    expect(entry.args).toEqual({ title: 'Hello', body: 'World' });
    expect(h2?.text).toBe('Hello');
    expect(p?.text).toBe('World');
  });

  it('hashMarkup is stable (tutorial: hash stability snippet)', () => {
    const nodeA = createNode('button', { text: 'click' });
    const nodeB = createNode('button', { text: 'click' });
    expect(hashMarkup(renderMarkup(nodeA))).toBe(hashMarkup(renderMarkup(nodeB)));
  });

  it('hashMarkup diverges (tutorial: hash divergence snippet)', () => {
    const nodeA = createNode('button', { text: 'click' });
    const nodeB = createNode('button', { text: 'tap' });
    expect(hashMarkup(renderMarkup(nodeA))).not.toBe(hashMarkup(renderMarkup(nodeB)));
  });
});

describe('tutorial 69 — play function runner', () => {
  it('runs steps in order and reports ok / error per step (tutorial: play success snippet)', async () => {
    const registry = createStoryRegistry();
    registry.register<CounterArgs>({
      title: 'Interaction/Counter',
      render: (args) => {
        let count = args.initial;
        const button = createNode('button', { text: String(count) });
        addHandler(button, 'click', () => {
          count += 1;
          button.text = String(count);
        });
        return button;
      },
      stories: {
        FromZero: {
          args: { initial: 0 },
          play: async ({ canvasElement, step }) => {
            await step('starts at 0', async () => {
              const [button] = canvasElement.querySelectorAll('button');
              if (button?.text !== '0') throw new Error(`expected 0, got ${button?.text}`);
            });
            await step('click twice → 2', async () => {
              const [button] = canvasElement.querySelectorAll('button');
              if (!button) throw new Error('button missing');
              fireEvent(button, { type: 'click', target: button });
              fireEvent(button, { type: 'click', target: button });
              if (button.text !== '2') throw new Error(`expected 2, got ${button.text}`);
            });
          },
        },
      },
    });

    const { canvas } = registry.mount('Interaction/Counter', 'FromZero');
    const result = await registry.play('Interaction/Counter', 'FromZero', canvas);

    expect(result.ok).toBe(true);
    expect(result.steps).toEqual([
      { label: 'starts at 0', ok: true },
      { label: 'click twice → 2', ok: true },
    ]);
  });

  it('records a step failure without swallowing it (tutorial: play failure snippet)', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Interaction/Fail',
      render: () => createNode('button', { text: 'nope' }),
      stories: {
        Broken: {
          play: async ({ step }) => {
            await step('fails', async () => {
              throw new Error('intentional');
            });
          },
        },
      },
    });

    const { canvas } = registry.mount('Interaction/Fail', 'Broken');
    const result = await registry.play('Interaction/Fail', 'Broken', canvas);

    expect(result.ok).toBe(false);
    expect(result.steps).toEqual([{ label: 'fails', ok: false, error: 'intentional' }]);
  });
});

describe('tutorial 69 — runA11y', () => {
  it('detects a button with no accessible name (tutorial: a11y broken snippet)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/BrokenButton',
      render: () => createNode('button'),
      stories: {
        NoLabel: {},
      },
    });

    const { canvas } = registry.mount('A11y/BrokenButton', 'NoLabel');
    const { violations } = registry.runA11y('A11y/BrokenButton', 'NoLabel', canvas);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.id).toBe('button-name');
    expect(violations[0]?.impact).toBe('critical');
  });

  it('reports zero violations for a labelled button (tutorial: a11y ok snippet)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/OkButton',
      render: () => createNode('button', { text: 'Submit' }),
      stories: {
        Labelled: {},
      },
    });

    const { canvas } = registry.mount('A11y/OkButton', 'Labelled');
    const { violations } = registry.runA11y('A11y/OkButton', 'Labelled', canvas);

    expect(violations).toEqual([]);
  });

  it('honors parameters.a11y.disable (tutorial: a11y opt-out snippet)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/Skipped',
      render: () => createNode('button'),
      parameters: { a11y: { disable: true } },
      stories: {
        Skipped: {},
      },
    });

    const { canvas } = registry.mount('A11y/Skipped', 'Skipped');
    const { violations } = registry.runA11y('A11y/Skipped', 'Skipped', canvas);

    expect(violations).toEqual([]);
  });
});

describe('tutorial 67 — cross-target parity for RSC harness', () => {
  it('storybook8 + playwright-ct + chromatic emit distinct dialects for the same neutral event (tutorial: cross-target dialect snippet)', () => {
    const targets = ['storybook8', 'playwright-ct', 'chromatic'] as const;
    const dialects = targets.map((target) => {
      const session = startRscHarness({ target, componentId: 'ArticlePage' });
      const step = beginRscRender(session);
      return { target, providerEvent: step.providerEvent };
    });

    // All targets emit the same neutral event.
    expect(new Set(dialects.map((d) => d.providerEvent)).size).toBe(3);
    expect(dialects.find((d) => d.target === 'storybook8')?.providerEvent).toBe('storybook.play.start');
    expect(dialects.find((d) => d.target === 'playwright-ct')?.providerEvent).toBe('pwct.mount.rsc.start');
    expect(dialects.find((d) => d.target === 'chromatic')?.providerEvent).toBe('chromatic.capture.rsc.start');
  });
});

describe('tutorial 68 — form + resolve records enhanced flag in metadata', () => {
  it('non-enhanced session resolves with enhanced=false (tutorial: non-enhanced snippet)', () => {
    const session = startFormActionSession({
      target: 'playwright-ct',
      formId: 'quick-form',
      initial: { done: false },
    });

    markFormStatusPending(session, 'submit');
    const resolved = resolveFormAction(session, { done: true });

    expect(resolved.metadata.enhanced).toBe(false);
    expect(session.enhanced).toBe(false);
  });
});

describe('tutorial 69 — coverage report', () => {
  it('reports per-story coverage flags + overall percentage (tutorial: coverage snippet)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Complete',
      render: () => createNode('button', { text: 'ok' }),
      parameters: { chromatic: { diffThreshold: 0.01 } },
      stories: {
        Primary: {
          play: async ({ step }) => {
            await step('noop', async () => {});
          },
        },
      },
    });
    registry.register({
      title: 'MissingPlay',
      render: () => createNode('button', { text: 'ok' }),
      parameters: { chromatic: { diffThreshold: 0.01 } },
      stories: {
        Default: {},
      },
    });

    const entries = registry.list();
    const report = entries.map((entry) => ({
      id: entry.id,
      hasChromatic: entry.parameters.chromatic !== undefined,
      hasInteraction: entry.play !== undefined,
      hasA11y: !entry.parameters.a11y?.disable,
    }));

    expect(report).toEqual([
      { id: 'complete--primary', hasChromatic: true, hasInteraction: true, hasA11y: true },
      { id: 'missingplay--default', hasChromatic: true, hasInteraction: false, hasA11y: true },
    ]);

    const total = report.length;
    const withChromatic = report.filter((r) => r.hasChromatic).length;
    const withInteraction = report.filter((r) => r.hasInteraction).length;

    expect(withChromatic / total).toBe(1);
    expect(withInteraction / total).toBe(0.5);
  });
});
