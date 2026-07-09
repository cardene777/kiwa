/**
 * v1.34-5 docs 補強 (Issue #1052 / CAR-788) — tutorial 68 code snippet validation
 * for the server-side (`@kiwa-lab/nextjs` v1.2 server-action-advanced axis).
 *
 * `docs/tutorials/68-server-action-optimistic.md` に載っている
 * server-action-advanced snippet が実際に動作することを担保する。
 * client 側 (`@kiwa-lab/component` v0.3 form-action-advanced) の snippet は
 * `packages/component/tests/docs-tutorial-v1.34.test.ts` で cover。
 *
 * v1.23 → v1.34 で 12 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  redirectAction,
  revalidateActionPath,
  revalidateActionTag,
  startServerActionAdvanced,
  submitFormAction,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 68 — Server Action pipeline (server side)
// ---------------------------------------------------------------------------

describe('tutorial 68 — submitFormAction', () => {
  it('advances idle → submitted with the form fields captured (tutorial: submit snippet)', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });

    const step = submitFormAction(session, { email: 'user@example.com', optIn: 'true' });

    expect(step.state).toBe('submitted');
    expect(step.neutralEvent).toBe('action.form_submitted');
    expect(step.metadata.fieldCount).toBe(2);
    expect(step.metadata.fields).toBe('email,optIn');
    expect(session.form).toEqual({ email: 'user@example.com', optIn: 'true' });
  });

  it('rejects a double submit (tutorial: double submit guard snippet)', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });
    expect(() => submitFormAction(session, { email: 'other@example.com' })).toThrow(
      /is submitted, not idle/,
    );
  });
});

describe('tutorial 68 — revalidate + redirect ladder', () => {
  it('advances submitted → path-revalidated → tag-revalidated → redirected (tutorial: ladder snippet)', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });

    const pathStep = revalidateActionPath(session, '/subscribers');
    const tagStep = revalidateActionTag(session, 'subscriber-count');
    const redirectStep = redirectAction(session, '/dashboard');

    expect(pathStep.state).toBe('path-revalidated');
    expect(pathStep.neutralEvent).toBe('action.revalidate_path');
    expect(pathStep.metadata.path).toBe('/subscribers');
    expect(tagStep.state).toBe('tag-revalidated');
    expect(tagStep.neutralEvent).toBe('action.revalidate_tag');
    expect(tagStep.metadata.tag).toBe('subscriber-count');
    expect(redirectStep.state).toBe('redirected');
    expect(redirectStep.neutralEvent).toBe('action.redirected');
    expect(redirectStep.metadata.url).toBe('/dashboard');
    expect(session.revalidatedPaths).toEqual(['/subscribers']);
    expect(session.revalidatedTags).toEqual(['subscriber-count']);
    expect(session.redirectUrl).toBe('/dashboard');
  });

  it('rejects a revalidatePath that does not start with slash (tutorial: path guard snippet)', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });
    expect(() => revalidateActionPath(session, 'subscribers')).toThrow(/path must start with \//);
  });

  it('rejects a revalidateTag on an idle session (tutorial: idle guard snippet)', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    expect(() => revalidateActionTag(session, 'subscriber-count')).toThrow(/was not submitted/);
  });
});

describe('tutorial 68 — fidelity coverage (nextjs)', () => {
  it('nextjs covers 3 target × 6 axis = 18 cells (v1.49 advanced III 拡張後、 server-action-advanced axis 継続) (tutorial: fidelity snippet)', () => {
    const coverage = collectFidelityCoverage(['app-router', 'pages-router', 'edge-runtime']);
    expect(coverage.rows).toHaveLength(18);
    expect(coverage.axes).toContain('server-action-advanced');

    const actionRows = coverage.rows.filter((r) => r.axis === 'server-action-advanced');
    expect(actionRows).toHaveLength(3);
    for (const row of actionRows) {
      expect(row.neutralEvents).toEqual([
        'action.form_submitted',
        'action.revalidate_path',
        'action.revalidate_tag',
        'action.redirected',
      ]);
    }
  });
});
