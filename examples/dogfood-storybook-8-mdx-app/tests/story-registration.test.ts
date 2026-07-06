import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookMdxAdapter } from '../src/adapters/interface.js';
import {
  ALL_METAS,
  LAYOUT_METAS,
  PRIMITIVE_METAS,
  countLayoutStories,
  countPlayStories,
  countPrimitiveStories,
  countStories,
} from '../src/components/stories.js';
import { ALL_DOCS, countDocs } from '../src/mdx/docs.js';

let adapter: StorybookMdxAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-8-mdx-app — story registration', () => {
  it('T-DFSMDX-REG-001 registerAll registers all metas + docs', async () => {
    const descriptors = await adapter.registerAll(ALL_METAS, ALL_DOCS);
    expect(descriptors.length).toBe(countStories());
  });

  it('T-DFSMDX-REG-002 12 primitive metas each have at least 1 story', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const stories = await adapter.listStories();
    for (const meta of PRIMITIVE_METAS) {
      const primitive = stories.filter((s) => s.title === meta.title);
      expect(primitive.length).toBeGreaterThan(0);
    }
    expect(PRIMITIVE_METAS.length).toBe(12);
  });

  it('T-DFSMDX-REG-003 3 layout metas each have at least 1 story', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const stories = await adapter.listStories();
    for (const meta of LAYOUT_METAS) {
      const layout = stories.filter((s) => s.title === meta.title);
      expect(layout.length).toBeGreaterThan(0);
    }
    expect(LAYOUT_METAS.length).toBe(3);
    expect(countLayoutStories()).toBeGreaterThanOrEqual(6); // 3 layouts x 2 stories
  });

  it('T-DFSMDX-REG-004 countPlayStories matches actual play-carrying descriptors', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const stories = await adapter.listStories();
    const withPlay = stories.filter((s) => s.hasPlay).length;
    expect(withPlay).toBe(countPlayStories());
    // 5 interaction focus stories all carry play + additional Dropdown/Change,
    // Tabs/Switch, Modal/Closable are also play-carrying (some overlap).
    expect(withPlay).toBeGreaterThanOrEqual(6);
  });

  it('T-DFSMDX-REG-005 story ids follow the SB URL kebab-case invariant', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const stories = await adapter.listStories();
    for (const story of stories) {
      expect(story.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('T-DFSMDX-REG-006 trace records registerAll then listStories', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    await adapter.listStories();
    const traces = adapter.traces();
    const ops = traces.map((t) => t.op);
    expect(ops).toEqual(expect.arrayContaining(['registerAll', 'listStories']));
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFSMDX-REG-007 hasMdx reflects doc association after registerAll', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const stories = await adapter.listStories();
    // At least the docs cover all stories they list in associatedStoryIds.
    const withMdx = stories.filter((s) => s.hasMdx).length;
    expect(withMdx).toBeGreaterThan(0);
    // All docs must be counted.
    expect(ALL_DOCS.length).toBe(countDocs());
    // countDocs = 12 primitive + 3 layout + 1 form MDX = 16.
    expect(countDocs()).toBe(16);
  });

  it('T-DFSMDX-REG-008 registerAll increments story + doc count in trace detail', async () => {
    await adapter.registerAll(ALL_METAS, ALL_DOCS);
    const traces = adapter.traces();
    const reg = traces.find((t) => t.op === 'registerAll');
    expect(reg).toBeDefined();
    expect((reg?.detail as { docCount: number }).docCount).toBe(ALL_DOCS.length);
    expect((reg?.detail as { storyCount: number }).storyCount).toBe(countStories());
  });
});
