import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';
import { runA11yForAll } from '../src/flows/story-flows.js';

let adapter: StorybookAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-design-system — a11y checks (button-name / image-alt / label rules)', () => {
  it('T-DFSB-A11Y-001 Button/Primary has no a11y violations (button has label)', async () => {
    const report = await adapter.runA11y('DesignSystem/Button', 'Primary');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-002 Input/Empty has no a11y violations (label[for] wired)', async () => {
    const report = await adapter.runA11y('DesignSystem/Input', 'Empty');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-003 Card/Default has no a11y violations (no interactive el)', async () => {
    const report = await adapter.runA11y('DesignSystem/Card', 'Default');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-004 Modal/Open close button has an aria-label', async () => {
    const report = await adapter.runA11y('DesignSystem/Modal', 'Open');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-005 Avatar/Initials fallback carries aria-hidden and role=img on wrapper', async () => {
    const report = await adapter.runA11y('DesignSystem/Avatar', 'Initials');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-006 Icon/Meaningful uses role=img + aria-label', async () => {
    const report = await adapter.runA11y('DesignSystem/Icon', 'Meaningful');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-007 Icon/Decorative uses aria-hidden=true (no violation for decoration)', async () => {
    const report = await adapter.runA11y('DesignSystem/Icon', 'Decorative');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSB-A11Y-008 runA11yForAll returns a report per story', async () => {
    const reports = await runA11yForAll(adapter);
    const stories = await adapter.listStories();
    expect(reports).toHaveLength(stories.length);
  });

  it('T-DFSB-A11Y-009 metrics.a11yInvocations counts per story after runA11yForAll', async () => {
    await runA11yForAll(adapter);
    const stories = await adapter.listStories();
    expect(adapter.metrics().a11yInvocations).toBe(stories.length);
  });
});
