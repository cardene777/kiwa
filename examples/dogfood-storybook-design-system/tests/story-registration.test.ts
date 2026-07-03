import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { StorybookAdapter } from '../src/adapters/interface.js';
import {
  ALL_METAS,
  DESIGN_SYSTEM_METAS,
  countPlayStories,
  countPrimitiveStories,
  countStories,
} from '../src/components/stories.js';

let adapter: StorybookAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-storybook-design-system — story registration', () => {
  it('T-DFSB-REG-001 registerAll registers all 12 primitive metas + Form', async () => {
    const descriptors = await adapter.registerAll(ALL_METAS);
    expect(descriptors.length).toBe(countStories());
  });

  it('T-DFSB-REG-002 listStories returns 12 primitive titles (DesignSystem/*)', async () => {
    await adapter.registerAll(ALL_METAS);
    const stories = await adapter.listStories();
    const titles = new Set(stories.map((s) => s.title));
    // 12 primitives + Form = 13 titles in total
    expect(titles.size).toBe(DESIGN_SYSTEM_METAS.length + 1);
    for (const title of titles) {
      expect(title).toMatch(/^DesignSystem\//);
    }
    // The 12-primitive count is stable.
    const primitiveTitles = new Set(
      stories
        .filter((s) => DESIGN_SYSTEM_METAS.some((m) => m.title === s.title))
        .map((s) => s.title),
    );
    expect(primitiveTitles.size).toBe(12);
  });

  it('T-DFSB-REG-003 every primitive has at least one story registered', async () => {
    await adapter.registerAll(ALL_METAS);
    const stories = await adapter.listStories();
    for (const meta of DESIGN_SYSTEM_METAS) {
      const primitive = stories.filter((s) => s.title === meta.title);
      expect(primitive.length).toBeGreaterThan(0);
    }
    // The 12-primitive story count also equals countPrimitiveStories().
    const primitiveCount = stories.filter((s) =>
      DESIGN_SYSTEM_METAS.some((m) => m.title === s.title),
    ).length;
    expect(primitiveCount).toBe(countPrimitiveStories());
  });

  it('T-DFSB-REG-004 countPlayStories matches actual play-carrying descriptors', async () => {
    await adapter.registerAll(ALL_METAS);
    const stories = await adapter.listStories();
    const withPlay = stories.filter((s) => s.hasPlay).length;
    expect(withPlay).toBe(countPlayStories());
    expect(withPlay).toBeGreaterThanOrEqual(6);
  });

  it('T-DFSB-REG-005 story ids follow the SB URL kebab-case invariant', async () => {
    await adapter.registerAll(ALL_METAS);
    const stories = await adapter.listStories();
    for (const story of stories) {
      expect(story.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('T-DFSB-REG-006 trace records a registerAll op followed by listStories', async () => {
    await adapter.registerAll(ALL_METAS);
    await adapter.listStories();
    const traces = adapter.traces();
    const ops = traces.map((t) => t.op);
    expect(ops).toEqual(expect.arrayContaining(['registerAll', 'listStories']));
    expect(traces.every((t) => t.ok)).toBe(true);
  });
});
