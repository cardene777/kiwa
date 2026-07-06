import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import {
  computeStoryCoverage,
  registerAndDiscoverStories,
  renderAllMdxDocs,
  resolveArgsForAll,
  runA11yForAll,
  runInteractionFocusStories,
} from '../src/flows/story-flows.js';
import { countStories } from '../src/components/stories.js';

let adapter: StorybookMdxAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — end-to-end flows (mock mode)', () => {
  it('T-DFSMDX-E2E-001 registerAndDiscoverStories returns countStories() descriptors', async () => {
    const stories = await registerAndDiscoverStories(adapter);
    expect(stories).toHaveLength(countStories());
  });

  it('T-DFSMDX-E2E-002 resolveArgsForAll resolves args for every story', async () => {
    await registerAndDiscoverStories(adapter);
    const resolved = await resolveArgsForAll(adapter);
    expect(resolved.length).toBe(countStories());
    for (const r of resolved) {
      expect(r.argsCount).toBeGreaterThan(0);
    }
  });

  it('T-DFSMDX-E2E-003 renderAllMdxDocs returns 1 report per doc', async () => {
    await registerAndDiscoverStories(adapter);
    const reports = await renderAllMdxDocs(adapter);
    expect(reports.length).toBeGreaterThan(0);
    for (const r of reports) {
      expect(r.blocks.length).toBeGreaterThan(0);
    }
  });

  it('T-DFSMDX-E2E-004 runInteractionFocusStories drives the 5 focus stories', async () => {
    await registerAndDiscoverStories(adapter);
    const reports = await runInteractionFocusStories(adapter);
    expect(reports.length).toBe(5);
    for (const r of reports) {
      expect(r.ok).toBe(true);
    }
  });

  it('T-DFSMDX-E2E-005 runA11yForAll returns 0 violations for every story', async () => {
    await registerAndDiscoverStories(adapter);
    const reports = await runA11yForAll(adapter);
    for (const report of reports) {
      expect(report.violations.length).toBe(0);
    }
  });

  it('T-DFSMDX-E2E-006 computeStoryCoverage after full run reports high coverage', async () => {
    await registerAndDiscoverStories(adapter);
    await runInteractionFocusStories(adapter);
    await runA11yForAll(adapter);
    const coverage = await computeStoryCoverage(adapter);
    expect(coverage.totalStories).toBe(countStories());
    expect(coverage.coveragePct).toBeGreaterThanOrEqual(80);
  });

  it('T-DFSMDX-E2E-007 all 8 ops appear in a full-run trace stream with no failures', async () => {
    await registerAndDiscoverStories(adapter);
    await resolveArgsForAll(adapter);
    await renderAllMdxDocs(adapter);
    await runInteractionFocusStories(adapter);
    await runA11yForAll(adapter);
    await computeStoryCoverage(adapter);
    const traces = adapter.traces();
    const failures = traces.filter((t) => !t.ok);
    expect(failures).toHaveLength(0);
    const opsSeen = new Set(traces.map((t) => t.op));
    for (const required of [
      'registerAll',
      'listStories',
      'resolveArgs',
      'mount',
      'renderMdx',
      'runInteraction',
      'runA11y',
      'computeCoverage',
    ]) {
      expect(opsSeen.has(required)).toBe(true);
    }
  });

  it('T-DFSMDX-E2E-008 reset drops trace + metrics + MDX registry state', async () => {
    await registerAndDiscoverStories(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().mountInvocations).toBe(0);
    expect(adapter.metrics().mdxRenderInvocations).toBe(0);
    // After reset the adapter still functions.
    const stories = await registerAndDiscoverStories(adapter);
    expect(stories).toHaveLength(countStories());
  });
});
