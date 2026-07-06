import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import { ALL_METAS, INTERACTION_FOCUS_STORIES } from '../src/components/stories.js';
import { ALL_DOCS } from '../src/mdx/docs.js';
import { runInteractionFocusStories } from '../src/flows/story-flows.js';

let adapter: StorybookMdxAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — interaction runner (@storybook/test)', () => {
  it('T-DFSMDX-INT-001 Button/Interactive interaction records click + assert', async () => {
    const report = await adapter.runInteraction('DesignSystem/Button', 'Interactive');
    expect(report.ok).toBe(true);
    // click step + assert step.
    expect(report.steps).toHaveLength(2);
    expect(report.steps[0]?.op).toBe('click');
    expect(report.steps[1]?.op).toBe('assert');
    expect(report.assertionsPassed).toBe(1);
    expect(report.assertionsFailed).toBe(0);
  });

  it('T-DFSMDX-INT-002 Input/Typing interaction records type + assert', async () => {
    const report = await adapter.runInteraction('DesignSystem/Input', 'Typing');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.op).toBe('type');
    expect(report.steps[1]?.op).toBe('assert');
  });

  it('T-DFSMDX-INT-003 Modal/Closable interaction fires close handler', async () => {
    const report = await adapter.runInteraction('DesignSystem/Modal', 'Closable');
    expect(report.ok).toBe(true);
    expect(report.assertionsPassed).toBe(1);
  });

  it('T-DFSMDX-INT-004 Form/Submit interaction fires submit handler', async () => {
    const report = await adapter.runInteraction('DesignSystem/Form', 'Submit');
    expect(report.ok).toBe(true);
    expect(report.assertionsPassed).toBe(1);
  });

  it('T-DFSMDX-INT-005 Tabs/Switch interaction fires select handler', async () => {
    const report = await adapter.runInteraction('DesignSystem/Tabs', 'Switch');
    expect(report.ok).toBe(true);
    expect(report.assertionsPassed).toBe(1);
  });

  it('T-DFSMDX-INT-006 non-play story returns empty steps + ok=true (fast-path)', async () => {
    const report = await adapter.runInteraction('DesignSystem/Card', 'Default');
    expect(report.ok).toBe(true);
    expect(report.steps).toHaveLength(0);
    expect(report.assertionsPassed).toBe(0);
    expect(report.assertionsFailed).toBe(0);
  });

  it('T-DFSMDX-INT-007 runInteractionFocusStories runs all 5 focus stories', async () => {
    const reports = await runInteractionFocusStories(adapter);
    expect(reports.length).toBe(INTERACTION_FOCUS_STORIES.length);
    expect(INTERACTION_FOCUS_STORIES.length).toBe(5);
    for (const r of reports) {
      expect(r.ok).toBe(true);
      expect(r.assertionsPassed).toBe(1);
    }
  });

  it('T-DFSMDX-INT-008 metrics.interactionInvocations increments per call', async () => {
    await adapter.runInteraction('DesignSystem/Button', 'Interactive');
    await adapter.runInteraction('DesignSystem/Input', 'Typing');
    await adapter.runInteraction('DesignSystem/Modal', 'Closable');
    expect(adapter.metrics().interactionInvocations).toBe(3);
  });

  it('T-DFSMDX-INT-009 metrics.assertionsRun increments per assertion evaluated', async () => {
    await runInteractionFocusStories(adapter);
    // 5 focus stories × 1 baked-in assertion = 5.
    expect(adapter.metrics().assertionsRun).toBe(5);
  });

  it('T-DFSMDX-INT-010 trace records ok=true for successful interaction', async () => {
    await adapter.runInteraction('DesignSystem/Button', 'Interactive');
    const traces = adapter.traces().filter((t) => t.op === 'runInteraction');
    expect(traces).toHaveLength(1);
    expect(traces[0]?.ok).toBe(true);
    expect(
      (traces[0]?.detail as { assertionsPassed: number }).assertionsPassed,
    ).toBe(1);
  });

  it('T-DFSMDX-INT-011 op classifier maps step labels to click/type/assert', async () => {
    const report = await adapter.runInteraction('DesignSystem/Input', 'Typing');
    // The Typing play uses label "type into the input" — classifier maps to type.
    const typeStep = report.steps.find((s) => s.op === 'type');
    expect(typeStep).toBeDefined();
    expect(typeStep?.label).toBe('type into the input');
  });

  it('T-DFSMDX-INT-012 assert step reports handlersInvoked in detail', async () => {
    const report = await adapter.runInteraction('DesignSystem/Button', 'Interactive');
    const assertStep = report.steps.find((s) => s.op === 'assert');
    expect(assertStep).toBeDefined();
    expect(assertStep?.ok).toBe(true);
    const detail = assertStep?.detail as { handlersInvoked: number };
    expect(detail.handlersInvoked).toBeGreaterThanOrEqual(1);
  });
});
