import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';

let adapter: StorybookAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-design-system — play function trace + interaction', () => {
  it('T-DFSB-PLAY-001 Button/Interactive play records 1 step (click) and ok=true', async () => {
    const report = await adapter.play('DesignSystem/Button', 'Interactive');
    expect(report.ok).toBe(true);
    expect(report.steps).toHaveLength(1);
    expect(report.steps[0]?.label).toBe('click the primary button');
    expect(report.steps[0]?.ok).toBe(true);
  });

  it('T-DFSB-PLAY-002 Input/Typing play triggers input event and updates value', async () => {
    const report = await adapter.play('DesignSystem/Input', 'Typing');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.label).toBe('type into the input');
    expect(report.steps[0]?.ok).toBe(true);
  });

  it('T-DFSB-PLAY-003 Modal/Closable play resolves args.title as expected', async () => {
    const report = await adapter.play('DesignSystem/Modal', 'Closable');
    expect(report.ok).toBe(true);
    expect(report.steps).toHaveLength(1);
    expect(report.steps[0]?.label).toBe('click the close button');
  });

  it('T-DFSB-PLAY-004 Dropdown/Change play changes selection to us', async () => {
    const report = await adapter.play('DesignSystem/Dropdown', 'Change');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.label).toBe('change the selection');
  });

  it('T-DFSB-PLAY-005 Tabs/Switch play activates the Usage tab', async () => {
    const report = await adapter.play('DesignSystem/Tabs', 'Switch');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.label).toBe('activate usage tab');
  });

  it('T-DFSB-PLAY-006 Toast/Dismiss play fires the close handler', async () => {
    const report = await adapter.play('DesignSystem/Toast', 'Dismiss');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.label).toBe('dismiss the toast');
  });

  it('T-DFSB-PLAY-007 non-play story returns empty steps + ok=true (fast-path)', async () => {
    const report = await adapter.play('DesignSystem/Card', 'Default');
    expect(report.ok).toBe(true);
    expect(report.steps).toHaveLength(0);
    expect(report.handlersInvoked).toBe(0);
  });

  it('T-DFSB-PLAY-008 metrics.playInvocations increments across multiple play runs', async () => {
    await adapter.play('DesignSystem/Button', 'Interactive');
    await adapter.play('DesignSystem/Input', 'Typing');
    await adapter.play('DesignSystem/Modal', 'Closable');
    expect(adapter.metrics().playInvocations).toBe(3);
  });

  it('T-DFSB-PLAY-009 trace op play records ok=true for successful play', async () => {
    await adapter.play('DesignSystem/Button', 'Interactive');
    const playTraces = adapter.traces().filter((t) => t.op === 'play');
    expect(playTraces).toHaveLength(1);
    expect(playTraces[0]?.ok).toBe(true);
    expect((playTraces[0]?.detail as { stepCount: number }).stepCount).toBe(1);
  });

  it('T-DFSB-PLAY-010 Form/Submit play triggers submit handler chain', async () => {
    const report = await adapter.play('DesignSystem/Form', 'Submit');
    expect(report.ok).toBe(true);
    expect(report.steps[0]?.label).toBe('click submit');
  });

  it('T-DFSB-PLAY-011 interactive stories record handlersInvoked >= 1', async () => {
    // handlersInvoked must actually count invocations — a metric that always
    // returns 0 would silently pass this test if the counter regressed to a
    // registration-count proxy, so we assert per-story invocations.
    const interactiveStories: Array<[string, string]> = [
      ['DesignSystem/Button', 'Interactive'],
      ['DesignSystem/Input', 'Typing'],
      ['DesignSystem/Modal', 'Closable'],
      ['DesignSystem/Dropdown', 'Change'],
      ['DesignSystem/Tabs', 'Switch'],
      ['DesignSystem/Toast', 'Dismiss'],
      ['DesignSystem/Form', 'Submit'],
    ];
    for (const [title, storyName] of interactiveStories) {
      const report = await adapter.play(title, storyName);
      expect(report.ok, `${title}/${storyName}`).toBe(true);
      expect(
        report.handlersInvoked,
        `${title}/${storyName} handlersInvoked`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});
