import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';
import { ALL_DOCS } from '../src/mdx/docs.js';
import { runA11yForAll } from '../src/flows/story-flows.js';

let adapter: StorybookMdxAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — a11y (button-name / image-alt / label rules)', () => {
  it('T-DFSMDX-A11Y-001 Button/Primary has no a11y violations', async () => {
    const report = await adapter.runA11y('DesignSystem/Button', 'Primary');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-002 Input/Empty has no violations (label wired)', async () => {
    const report = await adapter.runA11y('DesignSystem/Input', 'Empty');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-003 Modal/Open close button has an aria-label', async () => {
    const report = await adapter.runA11y('DesignSystem/Modal', 'Open');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-004 Layout/PageContainer has no violations', async () => {
    const report = await adapter.runA11y('Layout/PageContainer', 'Default');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-005 Layout/SectionRow columns render without violations', async () => {
    const report = await adapter.runA11y('Layout/SectionRow', 'ThreeColumn');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-006 Layout/SidebarShell nav has no violations', async () => {
    const report = await adapter.runA11y('Layout/SidebarShell', 'IntroActive');
    expect(report.violations).toHaveLength(0);
  });

  it('T-DFSMDX-A11Y-007 runA11yForAll returns a report per story', async () => {
    const reports = await runA11yForAll(adapter);
    const stories = await adapter.listStories();
    expect(reports).toHaveLength(stories.length);
  });

  it('T-DFSMDX-A11Y-008 metrics.a11yInvocations matches story count', async () => {
    await runA11yForAll(adapter);
    const stories = await adapter.listStories();
    expect(adapter.metrics().a11yInvocations).toBe(stories.length);
  });
});
