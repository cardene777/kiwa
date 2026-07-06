import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import { ALL_METAS } from '../src/components/stories.js';
import { ALL_DOCS } from '../src/mdx/docs.js';
import {
  registerAndDiscoverStories,
  runA11yForAll,
  runInteractionFocusStories,
} from '../src/flows/story-flows.js';

let adapter: StorybookMdxAdapter;

beforeEach(async () => {
  adapter = makeMockAdapter();
  await adapter.registerAll(ALL_METAS, ALL_DOCS);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — coverage report', () => {
  it('T-DFSMDX-COV-001 computeCoverage returns 1 entry per registered story', async () => {
    const stories = await adapter.listStories();
    const coverage = await adapter.computeCoverage();
    expect(coverage.entries.length).toBe(stories.length);
    expect(coverage.totalStories).toBe(stories.length);
  });

  it('T-DFSMDX-COV-002 initial coverage before any a11y/interaction run is 0%', async () => {
    // Immediately after registerAll (no runA11y / runInteraction calls yet)
    // covered = 0 because coverage requires MDX + a11y.
    const coverage = await adapter.computeCoverage();
    expect(coverage.coveredStories).toBe(0);
    expect(coverage.coveragePct).toBe(0);
  });

  it('T-DFSMDX-COV-003 running a11y for all stories flips hasA11y to true', async () => {
    await runA11yForAll(adapter);
    const coverage = await adapter.computeCoverage();
    const stories = await adapter.listStories();
    const withA11y = coverage.entries.filter((e) => e.hasA11y).length;
    expect(withA11y).toBe(stories.length);
  });

  it('T-DFSMDX-COV-004 stories with associated MDX docs have hasMdx=true', async () => {
    const coverage = await adapter.computeCoverage();
    // At least the stories listed in ALL_DOCS associatedStoryIds must be flagged.
    const associated = new Set<string>();
    for (const doc of ALL_DOCS) {
      for (const id of doc.associatedStoryIds) associated.add(id);
    }
    const withMdx = coverage.entries.filter((e) => e.hasMdx).length;
    expect(withMdx).toBe(associated.size);
  });

  it('T-DFSMDX-COV-005 running interactions flips hasInteraction for the 5 focus stories', async () => {
    await runInteractionFocusStories(adapter);
    const coverage = await adapter.computeCoverage();
    const withInteraction = coverage.entries.filter((e) => e.hasInteraction).length;
    expect(withInteraction).toBe(5);
  });

  it('T-DFSMDX-COV-006 full run (MDX + a11y) reaches high coverage percentage', async () => {
    // MDX docs cover most stories via associatedStoryIds. After runA11yForAll
    // every story has hasA11y = true. Coverage = MDX AND a11y.
    await runA11yForAll(adapter);
    const coverage = await adapter.computeCoverage();
    expect(coverage.coveragePct).toBeGreaterThanOrEqual(80);
  });

  it('T-DFSMDX-COV-007 uncovered entries are still reported (not omitted)', async () => {
    const coverage = await adapter.computeCoverage();
    // Even without running a11y / interaction, every story is reported with
    // covered=false — the caller uses this to identify gaps.
    for (const entry of coverage.entries) {
      expect(entry.covered).toBe(false);
    }
  });

  it('T-DFSMDX-COV-008 trace records computeCoverage with totalStories detail', async () => {
    await adapter.computeCoverage();
    const traces = adapter.traces().filter((t) => t.op === 'computeCoverage');
    expect(traces).toHaveLength(1);
    const detail = traces[0]?.detail as {
      totalStories: number;
      coveredStories: number;
      coveragePct: number;
    };
    expect(detail.totalStories).toBeGreaterThan(0);
    expect(detail.coveragePct).toBeGreaterThanOrEqual(0);
    expect(detail.coveragePct).toBeLessThanOrEqual(100);
  });

  it('T-DFSMDX-COV-009 registerAndDiscoverStories + coverage returns consistent counts', async () => {
    // A fresh adapter — the beforeEach already registers, so start over.
    await adapter.reset();
    const stories = await registerAndDiscoverStories(adapter);
    const coverage = await adapter.computeCoverage();
    expect(coverage.totalStories).toBe(stories.length);
  });
});
